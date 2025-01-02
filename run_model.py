import logging
import os
import gc
import argparse
import math
import random
import warnings
import tqdm
import numpy as np
import pandas as pd
from sklearn import preprocessing

import torch
import torch.nn as nn
import torch.optim as optim
import torch.utils.data as utils

from script import dataloader, utility, earlystopping, opt
from model import models

def set_env(seed):
    os.environ['PYTHONHASHSEED'] = str(seed)
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True

def get_parameters():
    parser = argparse.ArgumentParser(description='STGCN')
    parser.add_argument('--enable_cuda', type=bool, default=True, help='enable CUDA')
    parser.add_argument('--seed', type=int, default=42, help='random seed')
    parser.add_argument('--dataset', type=str, default='metr-la', choices=['metr-la', 'pems-bay', 'pemsd7-m'])
    parser.add_argument('--n_his', type=int, default=12)
    parser.add_argument('--n_pred', type=int, default=3, help='prediction intervals')
    parser.add_argument('--time_intvl', type=int, default=5)
    parser.add_argument('--Kt', type=int, default=3)
    parser.add_argument('--stblock_num', type=int, default=2)
    parser.add_argument('--act_func', type=str, default='glu', choices=['glu', 'gtu'])
    parser.add_argument('--Ks', type=int, default=3, choices=[3, 2])
    parser.add_argument('--graph_conv_type', type=str, default='cheb_graph_conv', choices=['cheb_graph_conv', 'graph_conv'])
    parser.add_argument('--gso_type', type=str, default='sym_norm_lap', choices=['sym_norm_lap', 'rw_norm_lap', 'sym_renorm_adj', 'rw_renorm_adj'])
    parser.add_argument('--enable_bias', type=bool, default=True, help='enable bias')
    parser.add_argument('--droprate', type=float, default=0.5)
    parser.add_argument('--lr', type=float, default=0.001, help='learning rate')
    parser.add_argument('--weight_decay_rate', type=float, default=0.001, help='L2 penalty')
    parser.add_argument('--batch_size', type=int, default=32)
    parser.add_argument('--epochs', type=int, default=30)
    parser.add_argument('--opt', type=str, default='nadamw', choices=['adamw', 'nadamw', 'lion'])
    parser.add_argument('--step_size', type=int, default=10)
    parser.add_argument('--gamma', type=float, default=0.95)
    parser.add_argument('--patience', type=int, default=10)
    args = parser.parse_args()

    set_env(args.seed)

    device = torch.device('cuda' if args.enable_cuda and torch.cuda.is_available() else 'cpu')
    gc.collect()
    if args.enable_cuda and torch.cuda.is_available():
        torch.cuda.empty_cache()

    Ko = args.n_his - (args.Kt - 1) * 2 * args.stblock_num
    blocks = [[1]]
    for _ in range(args.stblock_num):
        blocks.append([64, 16, 64])
    blocks.append([128] if Ko == 0 else [128, 128])
    blocks.append([1])

    return args, device, blocks

def data_preparation(args, device):
    # Load adjacency matrix
    adj, n_vertex = dataloader.load_adj('adj_mx_la.pkl')

    # Ensure adjacency matrix is a valid numpy array
    adj = np.asarray(adj, dtype=np.float32)

    # Calculate GSO
    gso = utility.calc_gso(adj, args.gso_type)
    if args.graph_conv_type == 'cheb_graph_conv':
        gso = utility.calc_chebynet_gso(gso)
    args.gso = torch.from_numpy(gso.toarray().astype(np.float32)).to(device)

    # Load and preprocess time-series data
    data = pd.read_csv('./data/updated_speed.csv')
    val_test_split = int(data.shape[0] * 0.15)
    len_train = data.shape[0] - 2 * val_test_split

    train, val, test = dataloader.load_data('updated_speed.csv', len_train, val_test_split)

    # Drop non-numeric columns
    train = train.select_dtypes(include=[np.number])
    val = val.select_dtypes(include=[np.number])
    test = test.select_dtypes(include=[np.number])

    # Scale the data
    zscore = preprocessing.StandardScaler()
    train = zscore.fit_transform(train)
    val = zscore.transform(val)
    test = zscore.transform(test)

    # Transform data for model input
    x_train, y_train = dataloader.data_transform(train, args.n_his, args.n_pred, device)
    x_val, y_val = dataloader.data_transform(val, args.n_his, args.n_pred, device)
    x_test, y_test = dataloader.data_transform(test, args.n_his, args.n_pred, device)

    # Prepare data loaders
    train_iter = utils.DataLoader(utils.TensorDataset(x_train, y_train), batch_size=args.batch_size, shuffle=True)
    val_iter = utils.DataLoader(utils.TensorDataset(x_val, y_val), batch_size=args.batch_size, shuffle=False)
    test_iter = utils.DataLoader(utils.TensorDataset(x_test, y_test), batch_size=args.batch_size, shuffle=False)

    return n_vertex, zscore, train_iter, val_iter, test_iter



def prepare_model(args, blocks, n_vertex, device):
    loss_fn = nn.MSELoss()
    es = earlystopping.EarlyStopping(patience=args.patience, verbose=True, path=f"STGCN_{args.dataset}.pt")

    model_cls = models.STGCNChebGraphConv if args.graph_conv_type == 'cheb_graph_conv' else models.STGCNGraphConv
    model = model_cls(args, blocks, n_vertex).to(device)

    opt_dict = {
        "adamw": optim.AdamW,
        "nadamw": optim.NAdam,
        "lion": opt.Lion
    }
    optimizer = opt_dict[args.opt](params=model.parameters(), lr=args.lr, weight_decay=args.weight_decay_rate)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=args.step_size, gamma=args.gamma)

    return loss_fn, es, model, optimizer, scheduler

def train(args, model, loss_fn, optimizer, scheduler, es, train_iter, val_iter):
    for epoch in range(args.epochs):
        model.train()
        train_loss, num_samples = 0.0, 0
        for x, y in tqdm.tqdm(train_iter, desc=f"Epoch {epoch + 1}/{args.epochs}"):
            optimizer.zero_grad()
            y_pred = model(x).view(len(x), -1)
            loss = loss_fn(y_pred, y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * y.size(0)
            num_samples += y.size(0)
        scheduler.step()

        val_loss = evaluate(model, loss_fn, val_iter)
        print(f"Epoch {epoch + 1} | Train Loss: {train_loss / num_samples:.6f} | Val Loss: {val_loss:.6f}")

        es(val_loss, model)
        if es.early_stop:
            print("Early stopping triggered.")
            break

def save_predictions(model, test_iter, zscore, output_path):
    model.eval()
    predictions = []
    ground_truths = []

    for x_batch, y_batch in test_iter:
        y_pred = model(x_batch).view(len(x_batch), -1).cpu().numpy()
        y_true = y_batch.cpu().numpy()

        y_pred_original = zscore.inverse_transform(y_pred)
        y_true_original = zscore.inverse_transform(y_true)

        predictions.append(y_pred_original)
        ground_truths.append(y_true_original)

    predictions = np.concatenate(predictions, axis=0)
    ground_truths = np.concatenate(ground_truths, axis=0)

    output_data = np.hstack([predictions, ground_truths])
    columns = [f"Predicted_{i}" for i in range(predictions.shape[1])] + [f"True_{i}" for i in range(ground_truths.shape[1])]
    output_df = pd.DataFrame(output_data, columns=columns)
    output_df.to_csv(output_path, index=False)

    print(f"Predictions saved to {output_path}")


@torch.no_grad()
def evaluate(model, loss_fn, data_iter):
    model.eval()
    total_loss, num_samples = 0.0, 0
    for x, y in data_iter:
        y_pred = model(x).view(len(x), -1)
        total_loss += loss_fn(y_pred, y).item() * y.size(0)
        num_samples += y.size(0)
    return total_loss / num_samples

@torch.no_grad()
def test(model, loss_fn, test_iter, zscore, args):
    model.load_state_dict(torch.load(f"STGCN_{args.dataset}.pt"))
    model.eval()

    mse = utility.evaluate_model(model, loss_fn, test_iter)
    mae, rmse, wmape = utility.evaluate_metric(model, test_iter, zscore)
    print(f"Test Results - MSE: {mse:.6f}, MAE: {mae:.6f}, RMSE: {rmse:.6f}, WMAPE: {wmape:.6f}")
    save_predictions(model, test_iter, zscore, output_path)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    warnings.filterwarnings("ignore")

    args, device, blocks = get_parameters()
    n_vertex, zscore, train_iter, val_iter, test_iter = data_preparation(args, device)
    loss_fn, es, model, optimizer, scheduler = prepare_model(args, blocks, n_vertex, device)
    train(args, model, loss_fn, optimizer, scheduler, es, train_iter, val_iter)
    output_path = "./predictions_speed.csv"
    test(model, loss_fn, test_iter, zscore, args)
