import os
import numpy as np
import pandas as pd
import torch

import os
import pandas as pd
import numpy as np

def load_adj(file_name="adj_mx_la.pkl"):
    """
    Load the adjacency matrix from the given file in the data directory.

    Args:
        file_name (str): Name of the .pkl file (default: 'adj_mx_la.pkl').

    Returns:
        adj (np.ndarray): Adjacency matrix as a numpy array.
        n_vertex (int): Number of vertices (nodes) in the graph.
    """
    # 절대 경로 생성
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", file_name)

    # 파일 확인
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"{data_path} not found. Ensure the file exists.")

    # .pkl 파일 로드
    try:
        data = pd.read_pickle(data_path)
        print(f"Loaded adjacency data from {data_path}.")
    except Exception as e:
        raise ValueError(f"Error loading adjacency matrix from {data_path}: {e}")

    # Row 2 (정사각형 행렬)만 선택
    if not isinstance(data, list) or len(data) < 3:
        raise ValueError("Expected list with at least 3 elements in the .pkl file.")
    adj = data[2]  # Row 2: 정사각형 인접 행렬

    # 인접 행렬이 정사각형인지 확인
    if adj.ndim != 2 or adj.shape[0] != adj.shape[1]:
        raise ValueError(f"Adjacency matrix must be square. Found shape: {adj.shape}")

    n_vertex = adj.shape[0]
    return adj, n_vertex



def load_data(dataset_name, len_train, len_val):
    """
    Load time-series data from the dataset.

    Args:
        dataset_name (str): Name of the dataset file (e.g., 'speed.csv').
        len_train (int): Number of training samples.
        len_val (int): Number of validation samples.

    Returns:
        train (pd.DataFrame): Training data.
        val (pd.DataFrame): Validation data.
        test (pd.DataFrame): Testing data.
    """
    dataset_path = './data'
    data_path = os.path.join(dataset_path, dataset_name)

    # Load dataset
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"{data_path} not found.")
    
    data = pd.read_csv(data_path)

    # Split data into train, val, and test sets
    train = data.iloc[:len_train]
    val = data.iloc[len_train: len_train + len_val]
    test = data.iloc[:]

    return train, val, test


def data_transform(data, n_his, n_pred, device):
    """
    Transform time-series data into x (input) and y (target) for training/testing.

    Args:
        data (Union[pd.DataFrame, np.ndarray]): Time-series data.
        n_his (int): Number of historical time steps.
        n_pred (int): Number of prediction time steps.
        device (torch.device): Target device (CPU or GPU).

    Returns:
        torch.Tensor: Transformed x and y tensors.
    """
    # Convert to numpy array if data is a DataFrame
    if isinstance(data, pd.DataFrame):
        data = data.to_numpy()
    
    n_vertex = data.shape[1]
    len_record = data.shape[0]
    num = len_record - n_his - n_pred

    # Prepare x and y tensors
    x = np.zeros([num, 1, n_his, n_vertex], dtype=np.float32)
    y = np.zeros([num, n_vertex], dtype=np.float32)

    for i in range(num):
        head = i
        tail = i + n_his
        x[i, :, :, :] = data[head:tail].reshape(1, n_his, n_vertex)
        y[i] = data[tail + n_pred - 1]

    return torch.tensor(x).to(device), torch.tensor(y).to(device)
