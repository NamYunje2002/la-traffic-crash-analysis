import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import norm
import torch

def calc_gso(dir_adj, gso_type):
    """
    Calculate the Graph Shift Operator (GSO) based on the adjacency matrix and type.

    Args:
        dir_adj (np.ndarray or sp.spmatrix): Adjacency matrix.
        gso_type (str): Type of GSO ('sym_norm_adj', 'rw_norm_adj', etc.).

    Returns:
        gso (sp.spmatrix): Computed GSO matrix.
    """
    n_vertex = dir_adj.shape[0]

    # Convert to sparse CSC format if not already sparse
    if not sp.issparse(dir_adj):
        dir_adj = sp.csc_matrix(dir_adj)
    elif dir_adj.format != 'csc':
        dir_adj = dir_adj.tocsc()

    id = sp.identity(n_vertex, format='csc')

    # Symmetrizing the adjacency matrix
    adj = dir_adj + dir_adj.T.multiply(dir_adj.T > dir_adj) - dir_adj.multiply(dir_adj.T > dir_adj)

    # Adding self-loops if renormalization is required
    if gso_type in ['sym_renorm_adj', 'rw_renorm_adj', 'sym_renorm_lap', 'rw_renorm_lap']:
        adj += id

    # Symmetric normalization
    if gso_type in ['sym_norm_adj', 'sym_renorm_adj', 'sym_norm_lap', 'sym_renorm_lap']:
        row_sum = adj.sum(axis=1).A1
        row_sum_inv_sqrt = np.power(row_sum, -0.5)
        row_sum_inv_sqrt[np.isinf(row_sum_inv_sqrt)] = 0.0
        deg_inv_sqrt = sp.diags(row_sum_inv_sqrt, format='csc')
        sym_norm_adj = deg_inv_sqrt.dot(adj).dot(deg_inv_sqrt)

        if gso_type in ['sym_norm_lap', 'sym_renorm_lap']:
            gso = id - sym_norm_adj  # Symmetric Laplacian
        else:
            gso = sym_norm_adj  # Symmetric normalized adjacency

    # Random walk normalization
    elif gso_type in ['rw_norm_adj', 'rw_renorm_adj', 'rw_norm_lap', 'rw_renorm_lap']:
        row_sum = adj.sum(axis=1).A1
        row_sum_inv = np.power(row_sum, -1)
        row_sum_inv[np.isinf(row_sum_inv)] = 0.0
        deg_inv = sp.diags(row_sum_inv, format='csc')
        rw_norm_adj = deg_inv.dot(adj)

        if gso_type in ['rw_norm_lap', 'rw_renorm_lap']:
            gso = id - rw_norm_adj  # Random walk Laplacian
        else:
            gso = rw_norm_adj  # Random walk normalized adjacency

    else:
        raise ValueError(f"Invalid GSO type: {gso_type}")

    return gso

def calc_chebynet_gso(gso):
    """
    Normalize the GSO for use in Chebyshev graph convolution.

    Args:
        gso (np.ndarray or sp.spmatrix): Graph Shift Operator.

    Returns:
        gso (sp.spmatrix): Normalized GSO for Chebyshev convolution.
    """
    if not sp.issparse(gso):
        gso = sp.csc_matrix(gso)
    elif gso.format != 'csc':
        gso = gso.tocsc()

    id = sp.identity(gso.shape[0], format='csc')
    eigval_max = norm(gso, 2)  # Spectral norm

    if eigval_max >= 2:
        gso -= id
    else:
        gso = 2 * gso / eigval_max - id

    return gso

def cnv_sparse_mat_to_coo_tensor(sp_mat, device):
    """
    Convert a sparse matrix to a COO-format PyTorch sparse tensor.

    Args:
        sp_mat (sp.spmatrix): Sparse matrix in CSR or CSC format.
        device (torch.device): Target device for the tensor.

    Returns:
        torch.Tensor: PyTorch sparse tensor in COO format.
    """
    sp_coo_mat = sp_mat.tocoo()
    indices = torch.from_numpy(np.vstack((sp_coo_mat.row, sp_coo_mat.col)))
    values = torch.from_numpy(sp_coo_mat.data)
    size = torch.Size(sp_coo_mat.shape)

    if sp_mat.dtype in [np.float32, np.float64]:
        return torch.sparse_coo_tensor(indices=indices, values=values, size=size, dtype=torch.float32, device=device, requires_grad=False)
    else:
        raise TypeError(f"Unsupported dtype {sp_mat.dtype} for sparse matrix.")

def evaluate_model(model, loss_fn, data_iter):
    """
    Evaluate a model on a dataset and compute the loss.

    Args:
        model (torch.nn.Module): Model to evaluate.
        loss_fn (callable): Loss function.
        data_iter (torch.utils.data.DataLoader): Data loader for evaluation.

    Returns:
        float: Mean Squared Error (MSE) of the model.
    """
    model.eval()
    total_loss, total_samples = 0.0, 0
    with torch.no_grad():
        for x, y in data_iter:
            y_pred = model(x).view(len(x), -1)
            loss = loss_fn(y_pred, y)
            total_loss += loss.item() * y.shape[0]
            total_samples += y.shape[0]
    return total_loss / total_samples

def evaluate_metric(model, data_iter, scaler):
    """
    Evaluate the model and compute MAE, RMSE, and WMAPE metrics.

    Args:
        model (torch.nn.Module): Model to evaluate.
        data_iter (torch.utils.data.DataLoader): Data loader for evaluation.
        scaler (sklearn.preprocessing.StandardScaler): Scaler for data normalization.

    Returns:
        tuple: MAE, RMSE, and WMAPE metrics.
    """
    model.eval()
    mae, mse, sum_y = [], [], []

    with torch.no_grad():
        for x, y in data_iter:
            y = scaler.inverse_transform(y.cpu().numpy()).flatten()
            y_pred = scaler.inverse_transform(model(x).view(len(x), -1).cpu().numpy()).flatten()
            errors = np.abs(y - y_pred)

            mae.extend(errors)
            mse.extend(errors**2)
            sum_y.extend(np.abs(y))

    mae_mean = np.mean(mae)
    rmse = np.sqrt(np.mean(mse))
    wmape = np.sum(mae) / np.sum(sum_y)

    return mae_mean, rmse, wmape
