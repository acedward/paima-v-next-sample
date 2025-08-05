import { PaimaSTM } from "@paimaexample/sm";
import { grammar } from "@example/data-types";
import type { BaseStfInput, BaseStfOutput } from "@paimaexample/sm";
import {
  getLastSumFromExampleTable,
  insertStateMachineInput,
  insertSumIntoExampleTable,
} from "@example/database";
import type { StartConfigGameStateTransitions } from "@paimaexample/runtime";
import {
  newScheduledHeightData,
  newScheduledTimestampData,
} from "@paimaexample/db";
import { type SyncStateUpdateStream, World } from "@paimaexample/coroutine";
// import { createScheduledData } from "@paimaexample/db";

type MyEvents = {}; // TODO: replace
const stm = new PaimaSTM<typeof grammar, MyEvents>(grammar);

// Example promise.
async function sum(a: number, b: number) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return a + b;
}

export const storage: Record<string, {
  properties: Record<string, string>;
  owner: string;
}> = {};

function decodeString(data: Record<string, number>, length: number) {
  let str = "";
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(data[`${i}`]);
  }
  return str.trim();
}

stm.addStateTransition(
  "midnightContractState",
  function* (data) {
    const round = data.parsedInput.payload.content[0].content.value[0]["0"];
    const contract_address = decodeString(
      data.parsedInput.payload.content[1].content.value[0],
      64,
    );
    const token_id = decodeString(
      data.parsedInput.payload.content[2].content.value[0],
      64,
    );
    const property_name = decodeString(
      data.parsedInput.payload.content[3].content.value[0],
      32,
    );
    const value = decodeString(
      data.parsedInput.payload.content[4].content.value[0],
      32,
    );
    console.log(JSON.stringify(data.parsedInput.payload, null, 2));
    console.log(
      "🎉 [CONTRACT] Transaction receipt:",
      {
        round,
        contract_address,
        token_id,
        property_name,
        value,
      },
    );
    if (token_id.charCodeAt(0) === 0) {
      // Skip null token_id
      return;
    }
    if (!storage[token_id]) {
      storage[token_id] = { properties: {}, owner: "" };
    }
    storage[token_id].properties[property_name] = value;
  },
);

stm.addStateTransition(
  "transfer-assets",
  function* (data) {
    const { to, tokenId } = data.parsedInput.payload;
    if (!storage[tokenId]) {
      storage[tokenId] = { properties: {}, owner: "" };
    }
    storage[tokenId].owner = to;
    // yield* World.resolve(insertStateMachineInput, {
    //   inputs: `transfer ${value} from ${from} to ${to}`,
    //   block_height: data.blockHeight,
    // });
    return;
  },
);

// stm.finalize(); // this avoids people dynamically calling stm.addStateTransition after initialization

/**
 * This function allows you to route between different State Transition Functions
 * based on block height. In other words when a new update is pushed for your game
 * that includes new logic, this router allows your game node to cleanly maintain
 * backwards compatibility with the old history before the new update came into effect.
 * @param blockHeight - The block height to process the game state transitions for.
 * @param input - The input to process the game state transitions for.
 * @returns The result of the game state transitions.
 */
export const gameStateTransitions: StartConfigGameStateTransitions = function* (
  blockHeight: number,
  input: BaseStfInput,
): SyncStateUpdateStream<void> {
  if (blockHeight >= 0) {
    yield* stm.processInput(input);
  } else {
    yield* stm.processInput(input);
  }
  return;
};
