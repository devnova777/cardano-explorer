// Replace the entire content of api.js with this:

export async function getLatestBlock() {
  const response = await fetch('http://localhost:3001/api/block/latest');
  return response.json();
}

export async function getBlockTransactions(blockHash, page = 1, limit = 10) {
  const response = await fetch(
    `http://localhost:3001/api/block/${blockHash}/transactions?page=${page}&limit=${limit}`
  );
  return response.json();
}

export async function getTransaction(txHash) {
  const response = await fetch(`http://localhost:3001/api/tx/${txHash}`);
  return response.json();
}
