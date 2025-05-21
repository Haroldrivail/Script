// Function to show status messages
function showStatus(message, type = 'info') {
  if (!statusElement) return;
  
  statusElement.className = `status ${type}`;
  statusElement.innerHTML = `
    <span class="material-symbols-rounded" style="margin-right: 8px;">${type === 'error' ? 'error' : type === 'success' ? 'check_circle' : 'info'}</span>
    ${message}
  `;
  statusElement.style.display = "block";
  statusElement.style.opacity = '1';
  statusElement.setAttribute('aria-busy', type === 'info');
}
