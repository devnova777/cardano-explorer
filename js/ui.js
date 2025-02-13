export function displayBlock(response) {
  const block = response.data;

  document.getElementById('block-info').innerHTML = `
        <div class="card">
            <p>
                <strong>Block Height:</strong> 
                <span class="value">${block.height.toLocaleString()}</span>
            </p>
            <p>
                <strong>Block Hash:</strong> 
                <span class="hash">${block.hash}</span>
            </p>
            <p>
                <strong>Slot:</strong> 
                <span class="value">${block.slot.toLocaleString()}</span>
            </p>
            <p>
                <strong>Time:</strong> 
                <span class="value">${new Date(
                  block.time * 1000
                ).toLocaleString()}</span>
            </p>
            <p>
                <strong>Transactions:</strong> 
                <span class="value">${block.tx_count.toLocaleString()}</span>
            </p>
            <p>
                <strong>Size:</strong> 
                <span class="value">${block.size.toLocaleString()} bytes</span>
            </p>
            <p>
                <strong>Epoch:</strong> 
                <span class="value">${block.epoch}</span>
            </p>
            <p>
                <strong>Fees:</strong> 
                <span class="value">${(parseInt(block.fees) / 1000000).toFixed(
                  6
                )} ₳</span>
            </p>
        </div>
    `;
}

export function displayError(message) {
  document.getElementById('block-info').innerHTML = `
        <div class="error">
            <strong>Error:</strong> ${message}
        </div>
    `;
}

// Add loading state
export function displayLoading() {
  document.getElementById('block-info').innerHTML = `
        <div class="card">
            <p>Loading latest block data...</p>
        </div>
    `;
}
