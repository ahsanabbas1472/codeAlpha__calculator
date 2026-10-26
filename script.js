
const expressionDisplay = document.getElementById("expression");
const previewDisplay = document.getElementById("preview");
const buttons = document.querySelector(".buttons");

let expression = "";
let justCalculated = false;

// Safely calculate arithmetic expressions.
// Supports +, -, *, /, %, decimals and parentheses.
function calculate(expressionText) {
  const text = expressionText.replace(/\s/g, "");

  if (!text) return null;

  // Only allow arithmetic characters.
  if (!/^[0-9+\-*/%.()]+$/.test(text)) {
    throw new Error("Invalid expression");
  }

  // Convert 50% to 50/100.
  // Percentage means a fraction of 100.
  const normalized = text.replace(
    /(\d+(?:\.\d*)?|\.\d+)%/g,
    "($1/100)"
  );

  // Recursive-descent parser: no eval() needed.
  let position = 0;

  function parseExpression() {
    let value = parseTerm();

    while (true) {
      if (normalized[position] === "+") {
        position++;
        value += parseTerm();
      } else if (normalized[position] === "-") {
        position++;
        value -= parseTerm();
      } else {
        return value;
      }
    }
  }

  function parseTerm() {
    let value = parseUnary();

    while (true) {
      const operator = normalized[position];

      if (operator === "*" || operator === "/") {
        position++;
        const right = parseUnary();

        if (operator === "/" && right === 0) {
          throw new Error("Cannot divide by zero");
        }

        value = operator === "*" ? value * right : value / right;
      } else {
        return value;
      }
    }
  }

  function parseUnary() {
    if (normalized[position] === "+") {
      position++;
      return parseUnary();
    }

    if (normalized[position] === "-") {
      position++;
      return -parseUnary();
    }

    return parsePrimary();
  }

  function parsePrimary() {
    if (normalized[position] === "(") {
      position++;
      const value = parseExpression();

      if (normalized[position] !== ")") {
        throw new Error("Missing closing bracket");
      }

      position++;
      return value;
    }

    const remaining = normalized.slice(position);
    const match = remaining.match(/^(?:\d+\.?\d*|\.\d+)/);

    if (!match) {
      throw new Error("Incomplete expression");
    }

    position += match[0].length;
    return Number(match[0]);
  }

  const result = parseExpression();

  if (position !== normalized.length || !Number.isFinite(result)) {
    throw new Error("Invalid calculation");
  }

  return Number(result.toPrecision(12));
}

function formatResult(number) {
  return String(number);
}

function updateDisplay() {
  expressionDisplay.textContent = expression || "0";

  if (!expression) {
    previewDisplay.textContent = "Ready";
    return;
  }

  try {
    const result = calculate(expression);
    previewDisplay.textContent =
      result === null ? "Ready" : "= " + formatResult(result);
  } catch {
    previewDisplay.textContent = " ";
  }
}

function clearCalculator() {
  expression = "";
  justCalculated = false;
  updateDisplay();
}

function addValue(value) {
  if (justCalculated) {
    if (/[0-9.]/.test(value)) {
      expression = "";
    }
    justCalculated = false;
  }

  const last = expression.slice(-1);

  if (value === ".") {
    const currentNumber = expression.split(/[+\-*/()%]/).pop();

    if (currentNumber.includes(".")) return;

    if (!currentNumber) expression += "0";
  }

  // Prevent two operators in a row, except minus for negatives.
  if (/[+*/%]/.test(value) && /[+\-*/%]$/.test(expression)) {
    expression = expression.slice(0, -1);
  }

  expression += value;
  updateDisplay();
}

function backspace() {
  expression = expression.slice(0, -1);
  justCalculated = false;
  updateDisplay();
}

function toggleSign() {
  if (!expression) {
    expression = "-";
  } else {
    try {
      expression = String(-calculate(expression));
    } catch {
      expression = "-" + expression;
    }
  }

  justCalculated = false;
  updateDisplay();
}

function showResult() {
  try {
    const result = calculate(expression);

    if (result === null) return;

    expression = formatResult(result);
    justCalculated = true;
    updateDisplay();
    previewDisplay.textContent = "Result";
  } catch (error) {
    previewDisplay.textContent =
      error.message === "Cannot divide by zero"
        ? "Cannot divide by zero"
        : "Invalid expression";
  }
}

// Handle calculator button clicks.
buttons.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "clear") {
    clearCalculator();
  } else if (button.dataset.action === "backspace") {
    backspace();
  } else if (button.dataset.action === "calculate") {
    showResult();
  } else if (button.dataset.action === "sign") {
    toggleSign();
  } else if (button.dataset.value !== undefined) {
    addValue(button.dataset.value);
  }
});

// Keyboard support.
document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^[0-9.]$/.test(key)) {
    addValue(key);
  } else if (["+", "-", "*", "/", "%"].includes(key)) {
    addValue(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    showResult();
  } else if (key === "Backspace") {
    backspace();
  } else if (key === "Escape" || key === "Delete") {
    clearCalculator();
  } else if (key === "(" || key === ")") {
    addValue(key);
  }
});

updateDisplay();
