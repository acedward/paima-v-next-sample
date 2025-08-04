// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import * as WS from "ws";
// globalThis.WebSocket = WS.WebSocket;
import {
  type ContractAddress,
  NetworkId,
} from "@midnight-ntwrk/compact-runtime";
import {
  Counter,
  type CounterPrivateState,
  witnesses,
} from "./contract/src/index.ts";
import {
  type CoinInfo,
  nativeToken,
  Transaction,
  type TransactionId,
} from "@midnight-ntwrk/ledger";
import {
  type DeployedContract,
  findDeployedContract,
  type FoundContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
// import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";

import {
  type BalancedTransaction,
  createBalancedTx,
  type FinalizedTxData,
  type ImpureCircuitId,
  type MidnightProvider,
  type MidnightProviders,
  type UnbalancedTransaction,
  type WalletProvider,
} from "@midnight-ntwrk/midnight-js-types";
import { type Resource, WalletBuilder } from "@midnight-ntwrk/wallet";
import { type Wallet } from "@midnight-ntwrk/wallet-api";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";
import * as Rx from "rxjs";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import {
  assertIsContractAddress,
  toHex,
} from "@midnight-ntwrk/midnight-js-utils";
import {
  getLedgerNetworkId,
  getZswapNetworkId,
  setNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { dirname, resolve } from "node:path";
import * as fs from "node:fs";
import { Buffer } from "node:buffer";

const exists = fs.exists;

// Inlined common types for standalone script
type CounterCircuits = ImpureCircuitId<Counter.Contract<CounterPrivateState>>;

const CounterPrivateStateId = "counterPrivateState";

type CounterProviders = MidnightProviders<
  CounterCircuits,
  typeof CounterPrivateStateId,
  CounterPrivateState
>;

type CounterContract = Counter.Contract;

type DeployedCounterContract =
  | DeployedContract<CounterContract>
  | FoundContract<CounterContract>;

// Inlined config for standalone script
const currentDir = resolve(
  dirname(new URL(import.meta.url).pathname),
);

const contractConfig = {
  privateStateStoreName: "counter-private-state",
  zkConfigPath: resolve(
    currentDir,
    "contract",
    "src",
    "managed",
    "counter",
  ),
};

interface Config {
  readonly logDir: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
}

class StandaloneConfig implements Config {
  logDir = resolve(
    currentDir,
    "..",
    "logs",
    "standalone",
    `${new Date().toISOString()}.log`,
  );
  indexer = "http://127.0.0.1:8088/api/v1/graphql";
  indexerWS = "ws://127.0.0.1:8088/api/v1/graphql/ws";
  node = "http://127.0.0.1:9944";
  proofServer = "http://127.0.0.1:6300";
  constructor() {
    setNetworkId("Undeployed" as any);
  }
}

/**
 * This seed gives access to tokens minted in the genesis block of a local development node - only
 * used in standalone networks to build a wallet with initial funds.
 */
const GENESIS_MINT_WALLET_SEED =
  "0000000000000000000000000000000000000000000000000000000000000001";

// Standalone helper functions
const counterContractInstance: CounterContract = new Counter.Contract(
  witnesses,
);

const getCounterLedgerState = async (
  providers: CounterProviders,
  contractAddress: ContractAddress,
): Promise<bigint | null> => {
  assertIsContractAddress(contractAddress);
  console.log("🔍 Checking contract ledger state...");

  try {
    const contractState = await providers.publicDataProvider.queryContractState(
      contractAddress,
    );
    const state = contractState != null
      ? Counter.ledger(contractState.data).round
      : null;
    console.log(`📊 Ledger state: ${state}`);
    return state;
  } catch (error) {
    console.error("❌ Error getting counter ledger state:", error);
    throw error;
  }
};

const joinContract = async (
  providers: CounterProviders,
  contractAddress: string,
): Promise<DeployedCounterContract> => {
  const counterContract = await findDeployedContract(providers, {
    contractAddress,
    contract: counterContractInstance,
    privateStateId: "counterPrivateState",
    initialPrivateState: { privateCounter: 0 },
  });
  console.log(
    `Joined contract at address: ${counterContract.deployTxData.public.contractAddress}`,
  );
  return counterContract;
};

const increment = async (
  counterContract: DeployedCounterContract,
  contractAddress?: string,
  tokenId?: string,
  propertyName?: string,
  propertyValue?: string,
): Promise<FinalizedTxData> => {
  console.log("Incrementing...");
  // export circuit increment(contract_address_: Uint<254>, token_id_: Uint<254>, property_name_: Bytes<64>, value_: Bytes<64>): [] {

  // Use provided values or fall back to defaults
  const contractAddr = contractAddress ||
    "0x1234567890123456789012345678901234567890";
  const tokenIdValue = tokenId || "default_token";
  const propName = propertyName || "test A";
  const propValue = propertyValue || "test B";

  console.log(`📝 Using parameters:`);
  console.log(`   Contract Address: ${contractAddr}`);
  console.log(`   Token ID: ${tokenIdValue}`);
  console.log(`   Property Name: ${propName}`);
  console.log(`   Property Value: ${propValue}`);

  // Convert contract address to BigInt (simplified for demo - in real implementation would need proper conversion)
  const contractAddrBigInt = BigInt(
    Math.abs(
      contractAddr.split("").reduce(
        (a, b) => (a * 31 + b.charCodeAt(0)) % 1000000,
        0,
      ),
    ),
  ); // Hash to number

  // Convert token ID to BigInt (if it's numeric, otherwise use hash or similar)
  const tokenIdBigInt = BigInt(
    Math.abs(
      tokenIdValue.split("").reduce(
        (a, b) => (a * 31 + b.charCodeAt(0)) % 1000000,
        0,
      ),
    ),
  ); // Hash to number

  const finalizedTxData = await counterContract.callTx.increment(
    contractAddrBigInt,
    tokenIdBigInt,
    Uint8Array.from(
      propName.padEnd(128, " ").split("").map((c) => c.charCodeAt(0)),
    ),
    Uint8Array.from(
      propValue.padEnd(128, " ").split("").map((c) => c.charCodeAt(0)),
    ),
  );
  console.log(
    `Transaction ${finalizedTxData.public.txId} added in block ${finalizedTxData.public.blockHeight}`,
  );
  return finalizedTxData.public;
};

const displayCounterValue = async (
  providers: CounterProviders,
  counterContract: DeployedCounterContract,
): Promise<{ counterValue: bigint | null; contractAddress: string }> => {
  const contractAddress = counterContract.deployTxData.public.contractAddress;
  const counterValue = await getCounterLedgerState(providers, contractAddress);
  if (counterValue === null) {
    console.log(`There is no counter contract deployed at ${contractAddress}.`);
  } else {
    console.log(`Current counter value: ${Number(counterValue)}`);
  }
  return { contractAddress, counterValue };
};

const createWalletAndMidnightProvider = async (
  wallet: Wallet,
): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(wallet.state());
  return {
    coinPublicKey: state.coinPublicKey,
    encryptionPublicKey: state.encryptionPublicKey,
    balanceTx(
      tx: UnbalancedTransaction,
      newCoins: CoinInfo[],
    ): Promise<BalancedTransaction> {
      return wallet
        .balanceTransaction(
          ZswapTransaction.deserialize(
            tx.serialize(getLedgerNetworkId()),
            getZswapNetworkId(),
          ),
          newCoins,
        )
        .then((tx) => wallet.proveTransaction(tx))
        .then((zswapTx) =>
          Transaction.deserialize(
            zswapTx.serialize(getZswapNetworkId()),
            getLedgerNetworkId(),
          )
        )
        .then(createBalancedTx);
    },
    submitTx(tx: BalancedTransaction): Promise<TransactionId> {
      return wallet.submitTransaction(tx);
    },
  };
};

// const waitForFunds = (wallet: Wallet) =>
//   Rx.firstValueFrom(
//     wallet.state().pipe(
//       Rx.throttleTime(10_000),
//       Rx.tap((state: any) => {
//         const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
//         const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
//         console.log(
//           `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`,
//         );
//       }),
//       Rx.filter((state: any) => {
//         return state.syncProgress?.synced === true;
//       }),
//       Rx.map((s: any) => s.balances[nativeToken()] ?? 0n),
//       Rx.filter((balance) => balance > 0n),
//     ),
//   );

const buildWalletAndWaitForFunds = async (
  { indexer, indexerWS, node, proofServer }: Config,
  seed: string,
  filename: string,
): Promise<Wallet & Resource> => {
  const wallet = await WalletBuilder.buildFromSeed(
    indexer,
    indexerWS,
    proofServer,
    node,
    seed,
    NetworkId.Undeployed,
    "info",
  );
  console.log("✅ Wallet built successfully");
  wallet.start();

  // Wait for wallet to be initialized with a timeout
  console.log("🔄 Waiting for wallet to initialize...");
  const state = await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.timeout(30000), // 30 second timeout
      Rx.tap((state: any) => {
        console.log("🔗 [WALLET] Wallet state received:", {
          address: state.address,
          synced: state.syncProgress?.synced,
          balanceCount: Object.keys(state.balances || {}).length,
        });
      }),
    ),
  );

  console.log(`✅ Wallet initialized with address: ${state.address}`);
  return wallet as any;
};

const configureProviders = async (
  wallet: Wallet & Resource,
  config: Config,
) => {
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(
    wallet,
  );

  const privateStateProvider = levelPrivateStateProvider<
    typeof CounterPrivateStateId
  >({
    privateStateStoreName: contractConfig.privateStateStoreName,
  });

  const publicDataProvider = indexerPublicDataProvider(
    config.indexer,
    config.indexerWS,
    // WS.WebSocket,
  );

  // const zkConfigProvider = new NodeZkConfigProvider<"increment">(
  //   contractConfig.zkConfigPath,
  // );
  const zkConfigPath = window.location.origin; // '../../../contract/src/managed/bboard';

  const zkConfigProvider = new FetchZkConfigProvider(
    zkConfigPath,
    fetch.bind(window),
  );
  const proofProvider = httpClientProofProvider(config.proofServer);

  const providers: CounterProviders = {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
  return providers;
};

/**
 * Get contract address from command line arguments or from a file
 */
const getContractAddress = async (): Promise<string> => {
  return "0200b5f52945d06b4b1872eb352efa0bf3fc74cb23b9c2a80a120d37ca5ef0d87582";
  // First try to get from command line arguments
  // const contractAddressFromArgs = Deno.args[0];

  // if (contractAddressFromArgs) {
  //   console.log(
  //     `📋 Using contract address from arguments: ${contractAddressFromArgs}`,
  //   );
  //   return contractAddressFromArgs;
  // }

  // // If not provided via args, try to read from contract_address.txt file
  // const contractAddressFile = resolve(currentDir, "contract.json");

  // try {
  //   if (await exists(contractAddressFile)) {
  //     const contractAddressFromFile = JSON.parse(
  //       await Deno.readTextFile(contractAddressFile),
  //     ).contractAddress;

  //     if (contractAddressFromFile) {
  //       console.log(
  //         `📄 Using contract address from file ${contractAddressFile}: ${contractAddressFromFile}`,
  //       );
  //       return contractAddressFromFile;
  //     } else {
  //       throw new Error("Contract address file is empty");
  //     }
  //   } else {
  //     throw new Error(
  //       `Contract address file not found at ${contractAddressFile}`,
  //     );
  //   }
  // } catch (error) {
  //   console.error(`❌ Error reading contract address from file: ${error}`);
  //   console.error("❌ Error: Contract address is required");
  //   console.error(
  //     "Usage: deno run --allow-all increment.ts <CONTRACT_ADDRESS>",
  //   );
  //   console.error(
  //     "Or create a contract_address.txt file with the contract address",
  //   );
  //   console.error(
  //     "Example: deno run --allow-all increment.ts 0x1234567890abcdef1234567890abcdef12345678",
  //   );
  //   Deno.exit(1);
  // }
};

/**
 * Standalone script that joins a counter contract with a specific address and increments its value.
 *
 * Usage:
 *   deno run --allow-all increment.ts <CONTRACT_ADDRESS>
 *   or create a contract_address.txt file with the contract address
 *
 * Example:
 *   deno run --allow-all increment.ts 0x1234567890abcdef1234567890abcdef12345678
 */
async function joinAndIncrement(): Promise<void> {
  // Get contract address from command line arguments or file
  const contractAddress = await getContractAddress();

  console.log(
    `🚀 Starting join and increment process for contract: ${contractAddress}`,
  );

  // Initialize configuration
  const config = new StandaloneConfig();

  let wallet = null;

  try {
    console.log("🔗 Building wallet with genesis seed for standalone mode...");

    // Build wallet using genesis seed (which has initial funds in standalone mode)
    wallet = await buildWalletAndWaitForFunds(
      config,
      GENESIS_MINT_WALLET_SEED,
      "contract.json",
    );

    console.log("✅ Wallet built successfully");

    // Configure providers
    console.log("⚙️ Configuring providers...");
    const providers = await configureProviders(wallet, config);

    console.log("✅ Providers configured successfully");

    // Join the contract
    console.log(`🔗 Joining counter contract at address: ${contractAddress}`);
    const counterContract = await joinContract(providers, contractAddress);

    console.log("✅ Successfully joined the counter contract");

    // Display current counter value before increment
    console.log("📊 Displaying current counter value before increment...");
    const beforeResult = await displayCounterValue(providers, counterContract);
    console.log(`📊 Current counter value: ${beforeResult.counterValue}`);

    // Increment the counter
    console.log("🔢 Incrementing counter...");
    console.log({
      contractAddress,
      wallet,
      Counter,
      providers,
      counterContract,
      beforeResult,
    });
    const incrementResult = await increment(counterContract);

    console.log(
      `✅ Counter incremented successfully! Transaction ID: ${incrementResult.txId}`,
    );
    console.log(
      `✅ Counter incremented! Transaction: ${incrementResult.txId} in block ${incrementResult.blockHeight}`,
    );

    // Display counter value after increment
    console.log("📊 Displaying counter value after increment...");
    const afterResult = await displayCounterValue(providers, counterContract);
    console.log(`📊 New counter value: ${afterResult.counterValue}`);

    console.log("🎉 Join and increment process completed successfully!");
  } catch (error) {
    console.error("❌ Error during join and increment process:", error);
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    // Deno.exit(1);
    throw error;
  } finally {
    // Clean up wallet
    if (wallet) {
      try {
        console.log("🧹 Wallet closed successfully");
        // Deno.exit(0);
      } catch (error) {
        console.error("❌ Error closing wallet:", error);
      }
    }
  }
}

// Run the script if this file is executed directly
if (import.meta.main) {
  joinAndIncrement().catch((error) => {
    console.error("❌ Unhandled error:", error);
    // Deno.exit(1);
    throw error;
  });
}

// Separate functions for Web App use
let globalWallet: (Wallet & Resource) | null = null;
let globalProviders: CounterProviders | null = null;
let globalCounterContract: DeployedCounterContract | null = null;

const connectMidnightWallet = async (): Promise<{
  wallet: Wallet & Resource;
  providers: CounterProviders;
}> => {
  console.log("🔗 Building Midnight wallet with genesis seed...");

  const config = new StandaloneConfig();
  const wallet = await buildWalletAndWaitForFunds(
    config,
    GENESIS_MINT_WALLET_SEED,
    "contract.json",
  );

  console.log("✅ Midnight wallet built successfully");

  const providers = await configureProviders(wallet, config);
  console.log("✅ Providers configured successfully");

  // Store globally for later use
  globalWallet = wallet;
  globalProviders = providers;

  return { wallet, providers };
};

const connectToContract = async (
  providers: CounterProviders,
  contractAddress?: string,
): Promise<{
  counterContract: DeployedCounterContract;
  currentState: { counterValue: bigint | null; contractAddress: string };
}> => {
  const address = contractAddress || await getContractAddress();
  console.log(`🔗 Joining counter contract at address: ${address}`);

  const counterContract = await joinContract(providers, address);
  console.log("✅ Successfully joined the counter contract");

  // Get initial state
  const currentState = await displayCounterValue(providers, counterContract);
  console.log(`📊 Current counter value: ${currentState.counterValue}`);

  // Store globally for later use
  globalCounterContract = counterContract;

  return { counterContract, currentState };
};

const fetchCurrentCounterState = async (
  providers?: CounterProviders,
  counterContract?: DeployedCounterContract,
): Promise<{ counterValue: bigint | null; contractAddress: string }> => {
  const actualProviders = providers || globalProviders;
  const actualContract = counterContract || globalCounterContract;

  if (!actualProviders || !actualContract) {
    throw new Error("Providers and contract must be initialized first");
  }

  return await displayCounterValue(actualProviders, actualContract);
};

const incrementCounterValue = async (
  contractAddress?: string,
  tokenId?: string,
  propertyName?: string,
  propertyValue?: string,
  counterContract?: DeployedCounterContract,
): Promise<FinalizedTxData> => {
  const actualContract = counterContract || globalCounterContract;

  if (!actualContract) {
    throw new Error("Contract must be joined first");
  }

  console.log("🔢 Incrementing counter...");
  const result = await increment(
    actualContract,
    contractAddress,
    tokenId,
    propertyName,
    propertyValue,
  );
  console.log(
    `✅ Counter incremented successfully! Transaction ID: ${result.txId}`,
  );

  return result;
};

export {
  connectMidnightWallet,
  connectToContract,
  fetchCurrentCounterState,
  incrementCounterValue,
  joinAndIncrement,
};
