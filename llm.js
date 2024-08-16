import { LLM, LLM_API_URL } from "./const.js";
import { marvelheroes } from "./marvelheroes.js";
import { SYSTEM_MESSAGE } from "./prompt.js";
import { timezone } from "./time.js";

export async function reason(inquiry) {
  const prompt = `${SYSTEM_MESSAGE}\n\n${inquiry}`;
  const response = await generate(prompt);
  console.log(`----------\n${response}\n----------`);

  let conclusion = "";
  const action = await act(response);
  if (action === null) {
    return answer(response);
  }

  console.log("REASON result:", action.result);
  conclusion = await generate(finalPrompt(inquiry, action.result));
  return conclusion;
}

export async function answer(text) {
	const MARKER = "Answer:";
	const pos = text.lastIndexOf(MARKER);
	if (pos < 0) return text;
	const answer = text.substr(pos + MARKER.length).trim();
	return answer;
}

export async function act(text) {
  const MARKER = "Action:";
  const pos = text.lastIndexOf(MARKER);
  if (pos < 0) return null;

  const subtext = `${text.substr(pos)} + \n`;
  const matches = /Action:\s*(.*?)\n/.exec(subtext);
  const action = matches[1];
  if (!action) return null;

  const SEPARATOR = ":";
  const sep = action.indexOf(SEPARATOR);
  if (sep < 0) return null;

  const fnName = action.substring(0, sep);
  const fnArgs = action.substring(sep + 1).trim().split(" ");
  console.log('fnName', fnName)
  const onlyFunctions = ['timezone', 'marvelheroes']
  if (!onlyFunctions.includes(fnName.toLowerCase())) {
    return null
  }

  if (fnName.toLowerCase() === "timezone") {
    // @TODO concat all fnArgs until fnArgs.length - 1 and put in the first arg
    const result = timezone(fnArgs[0].toLowerCase(), fnArgs[(fnArgs.length - 1)])
    console.log("ACT: timezone", { args: fnArgs, result });
    return { action, name: fnName, args: fnArgs, result }
  }

  if (fnName.toLowerCase() === "marvelheroes") {
    const result = await marvelheroes(fnArgs[0].toLowerCase(), fnArgs[1]?.toLowerCase())
    console.log("ACT: marvelheroes", { args: fnArgs, result });
    return { action, name: fnName, args: fnArgs, result }
  }
  console.log("Not recognized action:", { action, name: fnName, args: fnArgs });
}

export function finalPrompt(inquiry, observation) {
  return `${inquiry}
    Observation: ${observation}
    Thought: Now I have the answer.
    Answer:`;
}

export async function generate(prompt) {
  if (!prompt) throw new Error("Prompt is required");

  const method = "POST";
  const headers = {
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({
			model: LLM,
			prompt,
			options: {
				num_predict: 200,
				temperature: 1,
				top_k: 20,
			},
			stream: false,
		});
  const request = { method, headers, body };
  const res = await fetch(LLM_API_URL, request);
  const { response } = await res.json();

  return response?.trim();
}
