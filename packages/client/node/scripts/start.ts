import { OrchestratorConfig, start } from "@paimaexample/orchestrator";
import { ComponentNames } from "@paimaexample/log";
import { Value } from "@sinclair/typebox/value";
import { contractAddressesEvmMain } from "@example/evm-contracts";

const config = Value.Parse(OrchestratorConfig, {
  logs: "stdout",
  processes: {
    [ComponentNames.TMUX]: false,
    [ComponentNames.TUI]: false,

    // Launch Dev DB & Collector
    [ComponentNames.PAIMA_DB]: true,
    [ComponentNames.COLLECTOR]: true,

    // Launch Hardhat & Deploy Contracts
    [ComponentNames.HARDHAT]: true,
    [ComponentNames.DEPLOY_EVM_CONTRACTS]: true,

    // Launch Cardano w/Dolos
    [ComponentNames.YACI_DEVKIT]: true,
    [ComponentNames.DOLOS]: true,
  },

  packageName: "jsr:@paimaexample",

  // Launch my processes
  processesToLaunch: [{
    // Start EVM (Hardhat) Chains and deploy contracts.
    stopProcessAtPort: [8545, 8546],
    processes: [
      {
        name: ComponentNames.HARDHAT,
        args: ["task", "-f", "@example/evm-contracts", "chain:start"],
        waitToExit: false,
        logs: "otel-compatible",
        type: "system-dependency",
      },
      {
        name: ComponentNames.HARDHAT_WAIT,
        args: ["task", "-f", "@example/evm-contracts", "chain:wait"],
      },
      {
        name: ComponentNames.DEPLOY_EVM_CONTRACTS,
        args: ["task", "-f", "@example/evm-contracts", "deploy"],
        type: "system-dependency",
      },
    ],
  }, {
    stopProcessAtPort: [8090, 10000, 50051, 3001],
    processes: [
      {
        name: ComponentNames.YACI_DEVKIT,
        args: ["task", "-f", "@example/cardano-contracts", "devkit:start"],
        waitToExit: false,
        logs: "otel-compatible",
        type: "system-dependency",
      },
      {
        name: ComponentNames.YACI_DEVKIT_WAIT,
        args: ["task", "-f", "@example/cardano-contracts", "devkit:wait"],
      },
      {
        name: ComponentNames.DOLOS,
        args: ["task", "-f", "@example/cardano-contracts", "dolos:start"],
        waitToExit: false,
        type: "system-dependency",
      },
      {
        name: ComponentNames.DOLOS_WAIT,
        args: ["task", "-f", "@example/cardano-contracts", "dolos:wait"],
      },
    ],
  }],

  // Launch the Batcher with our PaimaL2 Contract
  batcher: {
    paimaL2Address: contractAddressesEvmMain()["chain31337"][
      "PaimaL2ContractModule#MyPaimaL2Contract"
    ],
    batcherPrivateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    chainName: "hardhat",
  },
});

await start(config);
