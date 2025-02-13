// API endpoints for the Cardano Block Explorer

export async function getLatestBlock() {
  const response = await fetch('http://localhost:3001/api/block/latest');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getBlockDetails(hash) {
  const response = await fetch(`http://localhost:3001/api/block/${hash}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getBlockTransactions(blockHash, page = 1, limit = 10) {
  const response = await fetch(
    `http://localhost:3001/api/block/${blockHash}/transactions?page=${page}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getTransaction(txHash) {
  const response = await fetch(`http://localhost:3001/api/tx/${txHash}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getBlocks(page = 1, limit = 10) {
  const response = await fetch(
    `http://localhost:3001/api/blocks?page=${page}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
