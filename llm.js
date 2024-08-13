import { LLM, LLM_API_URL } from "./const.js";
import { marvelheroes } from "./marvelheroes.js";
import { timezone } from "./time.js";

const SYSTEM_MESSAGE = `You run in a process of Question, Thought, Action, Observation.

Use Thought to describe your thoughts about the question you have been asked.
Observation will be the result of running those actions.
Finally at the end, state the Answer.

If you can not answer the question from your memory, use Action to run one of these actions available to you:
- lookup: terms
- marvelheroes: module keyword
- time: at

Here are some sample sessions.

Question: What is capital of france?
Thought: This is about geography, I can recall the answer from my memory.
Action: lookup: capital of France.
Observation: Paris is the capital of France.
Answer: The capital of France is Paris.

Question: Who painted Mona Lisa?
Thought: This is about general knowledge, I can recall the answer from my memory.
Action: lookup: painter of Mona Lisa.
Observation: Mona Lisa was painted by Leonardo da Vinci .
Answer: Leonardo da Vinci painted Mona Lisa.

Question: What is the exchange rate from USD to EUR?
Thought: This is about currency exchange rates, I need to check the current rate.
Action: exchange: USD EUR
Observation: 0.8276 EUR for 1 USD.
Answer: The current exchange rate is 0.8276 EUR for 1 USD.

Question: give me all characters from spiderman comic book
Thought: This is about marvel character, I need to check data from marvel API.
Action: marvelheroes: characters spiderman
Observation: Marvel heroes with the comics title contains spiderman.
Answer: Comic titled with Spiderman has main characters such as Peter Parker as Spiderman, Aun May, dan Mary Jane.

Question: give me all comics with spiderman as one of the characters
Thought: This is about marvel comics, I need to check data from marvel API.
Action: marvelheroes: comics Spi
Observation: Comic titled Spiderman has one of characters named Spiderman.
Answer: Spiderman comic has the SpiderMan character.

Question: give me all marvel comics starts with Spi
Thought: This is about marvel comics, I need to check data from marvel API.
Action: marvelheroes: comics Spi
Observation: Comic's title starts with Spi is Spider-man.
Answer: Spider-Man comic's title starts with Spi.

Question: can you guess all marvel heroes starts with Spi?
Thought: This is about marvel heroes and characters, I need to check data from marvel API.
Action: marvelheroes: characters Spi
Observation: Heroes name starts with Spi is Spider-man.
Answer: Yes, I guess... Spider-man is marvel hero whose the name starts with Spi.

Question: What time is it in Bandung?
Thought: This is about local time, I need to check the current local time.
Action: timezone: Bandung
Observation: 8.29PM, it is evening already.
Answer: The time in Bandung is 8.29PM, have a nice evening, prepare for a bed time.

Let's go!`;

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
	if (pos < 0) return "?";
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
  if (fnName === "lookup") return null;

  if (fnName === "timezone") {
    const result = timezone(fnArgs[0])
    console.log("ACT: timezone", { args: fnArgs, result });
    return { action, name: fnName, args: fnArgs, result }
  }

  if (fnName === "marvelheroes") {
    const result = await marvelheroes(fnArgs[0], fnArgs[1])
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
				temperature: 0,
				top_k: 20,
			},
			stream: false,
		});
  const request = { method, headers, body };
  const res = await fetch(LLM_API_URL, request);
  const { response } = await res.json();

  return response?.trim();
}
