export async function getLatestBlock() {
  const response = await fetch('http://localhost:3001/api/block/latest');
  return response.json();
}

export async function getTransaction(txHash) {
  const response = await fetch(`http://localhost:3001/api/tx/${txHash}`);
  return response.json();
}
