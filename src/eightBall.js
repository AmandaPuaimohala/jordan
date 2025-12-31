export function showEightBall(popup) {
  // Clear previous popup text
  const popupText = document.getElementById('popup-text');
  if (popupText) popupText.textContent = '';

  // Remove previous eightball container if exists
  const existingContainer = document.getElementById('eightball-container');
  if (existingContainer) existingContainer.remove();

  // Create container
  const container = document.createElement('div');
  container.id = 'eightball-container';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
  `;
  popup.appendChild(container);

  // Input for the question
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Ask a question...';
  input.style.cssText = `
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    width: 200px;
    text-align: center;
  `;
  container.appendChild(input);

  // Button to get answer
  const button = document.createElement('button');
  button.textContent = 'Ask!';
  button.style.cssText = `
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    background: #3b5a7d;
    color: white;
    cursor: pointer;
  `;
  container.appendChild(button);

  // Answer text
  const answer = document.createElement('div');
  answer.style.cssText = `
    margin-top: 10px;
    font-weight: bold;
    color: #ffd700;
  `;
  container.appendChild(answer);

  // Possible answers
  const responses = [
    "✅",         
    "❌",          
    "💯",         
    "ʻAe",        
    "ʻAʻole",     
    "Si",    
    "🤷‍♀️",       
    ];

  button.addEventListener('click', () => {
    const question = input.value.trim();
    if (!question) {
      answer.textContent = "You need to ask something!";
      return;
    }
    const randomAnswer = responses[Math.floor(Math.random() * responses.length)];
    answer.textContent = randomAnswer;
  });

  // Stop function removes everything
  return function stopEightBall() {
    container.remove();
  };
}
