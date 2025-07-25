import { useEffect, useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

interface EVMWallet {
  privateKey: `0x${string}`;
  address: `0x${string}`;
}

interface MidnightWallet {
  address: string;
  connected: boolean;
}

interface ERC721Token {
  id: string;
  name: string;
  owner: string;
  properties: Record<string, string | number>;
  createdAt: Date;
}

interface Notification {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

// Initial token data with random owners
const generateInitialTokens = (): ERC721Token[] => {
  const randomOwners = [
    "0x742d35cc6bbf4c8e3f5a9bd5e5b4b9c3a1234567",
    "0x8ba1f109551bd432803012645a30215e8d2b0b5c",
    "0x5aae5c59d6e6ac0b86d1c2b6b9f5c8d2a7654321",
    "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
  ];

  const locationData = [
    {
      "streetAddress": "1600 Pennsylvania Ave NW",
      "zipCode": "20500",
      "city": "Washington",
      "state": "DC",
      "nearbyLandmark": "The White House",
      "cityFoundingDate": "1790-07-16",
    },
    {
      "streetAddress": "4059 Mt Lee Dr",
      "zipCode": "90068",
      "city": "Los Angeles",
      "state": "CA",
      "nearbyLandmark": "Hollywood Sign",
      "cityFoundingDate": "1781-09-04",
    },
    {
      "streetAddress": "1 Infinite Loop",
      "zipCode": "95014",
      "city": "Cupertino",
      "state": "CA",
      "nearbyLandmark": "Apple Park",
      "cityFoundingDate": "1955-10-10",
    },
    {
      "streetAddress": "350 5th Ave",
      "zipCode": "10118",
      "city": "New York",
      "state": "NY",
      "nearbyLandmark": "Empire State Building",
      "cityFoundingDate": "1624-01-01",
    },
    {
      "streetAddress": "221B Baker St",
      "zipCode": "02116",
      "city": "Boston",
      "state": "MA",
      "nearbyLandmark": "Sherlock Holmes Museum",
      "cityFoundingDate": "1630-09-07",
    },
  ];

  return locationData.map((location, index) => ({
    id: `initial_token_${index + 1}`,
    name: `${location.nearbyLandmark} NFT`,
    owner: randomOwners[index],
    properties: {
      streetAddress: location.streetAddress,
      zipCode: location.zipCode,
      city: location.city,
      state: location.state,
      nearbyLandmark: location.nearbyLandmark,
      cityFoundingDate: location.cityFoundingDate,
      rarity: index === 0 ? "legendary" : index < 3 ? "rare" : "common",
      tokenType: "Location Token",
    },
    createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)), // Stagger creation dates
  }));
};

export function WalletDemo() {
  const [evmWallet, setEvmWallet] = useState<EVMWallet | null>(null);
  const [midnightWallet, setMidnightWallet] = useState<MidnightWallet | null>(
    null,
  );
  const [tokens, setTokens] = useState<ERC721Token[]>(generateInitialTokens());
  const [selectedToken, setSelectedToken] = useState<string | null>(
    "initial_token_1",
  );
  const [tokenName, setTokenName] = useState<string>("");
  const [propertyKey, setPropertyKey] = useState<string>("");
  const [propertyValue, setPropertyValue] = useState<string>("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const showNotification = (
    type: Notification["type"],
    title: string,
    message: string,
  ) => {
    const id = Date.now();
    const notification: Notification = { id, type, title, message };
    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const generateNewEVMWallet = () => {
    console.log(
      "🔗 [NETWORK] Creating new EVM wallet - would connect to EVM network here",
    );
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const newWallet: EVMWallet = {
      privateKey,
      address: account.address,
    };
    setEvmWallet(newWallet);
    showNotification(
      "success",
      "EVM Wallet Created",
      `New EVM wallet: ${account.address.slice(0, 8)}...${
        account.address.slice(-6)
      }`,
    );
  };

  const connectMidnightWallet = () => {
    console.log(
      "🌙 [NETWORK] Connecting to Midnight wallet - would connect to Midnight network here",
    );
    // Generate a random Midnight-style address (simulated)
    const randomBytes = Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 256),
    );
    const midnightAddress = "mid1" +
      randomBytes.map((b) => b.toString(16).padStart(2, "0")).join("").slice(
        0,
        56,
      );

    const newMidnightWallet: MidnightWallet = {
      address: midnightAddress,
      connected: true,
    };
    setMidnightWallet(newMidnightWallet);
    showNotification(
      "success",
      "Midnight Wallet Connected",
      `Connected: ${midnightAddress.slice(0, 12)}...${
        midnightAddress.slice(-8)
      }`,
    );
  };

  const createERC721Token = () => {
    if (!tokenName.trim()) {
      showNotification(
        "error",
        "Missing Token Name",
        "Please enter a token name",
      );
      return;
    }

    if (!evmWallet) {
      showNotification(
        "error",
        "No EVM Wallet",
        "Please create an EVM wallet first",
      );
      return;
    }

    console.log(
      `🎨 [NETWORK] Creating new ERC721 token "${tokenName}" (adding to existing collection) - would deploy to EVM network here`,
    );

    const newToken: ERC721Token = {
      id: `token_${Date.now()}`,
      name: tokenName,
      owner: evmWallet.address,
      properties: {},
      createdAt: new Date(),
    };

    setTokens((prev) => [...prev, newToken]);
    setTokenName("");
    showNotification(
      "success",
      "ERC721 Token Created",
      `Token "${newToken.name}" created successfully!`,
    );
  };

  const addProperty = () => {
    if (!propertyKey.trim() || !propertyValue.trim()) {
      showNotification(
        "error",
        "Missing Property Data",
        "Please enter both property key and value",
      );
      return;
    }

    if (!selectedToken) {
      showNotification(
        "error",
        "No Token Selected",
        "Please select a token to add properties",
      );
      return;
    }

    if (!midnightWallet?.connected) {
      showNotification(
        "error",
        "Midnight Wallet Required",
        "Connect Midnight wallet to add properties",
      );
      return;
    }

    console.log(
      `🌙 [NETWORK] Adding property ${propertyKey}=${propertyValue} to token ${selectedToken} via Midnight network`,
    );

    setTokens((prev) =>
      prev.map((token) => {
        if (token.id === selectedToken) {
          return {
            ...token,
            properties: {
              ...token.properties,
              [propertyKey]: isNaN(Number(propertyValue))
                ? propertyValue
                : Number(propertyValue),
            },
          };
        }
        return token;
      })
    );

    setPropertyKey("");
    setPropertyValue("");
    showNotification(
      "success",
      "Property Added",
      `Added ${propertyKey}=${propertyValue} to token`,
    );
  };

  return (
    <div className="wallet-demo-section">
      {/* Notifications */}
      <div className="wallet-demo-notifications">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`wallet-demo-notification ${notification.type}`}
          >
            <div>
              <div className="notification-title">{notification.title}</div>
              <div className="notification-message">{notification.message}</div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="notification-close"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="wallet-demo-header"
      >
        <h2 className="wallet-demo-title">
          Multi-Chain Wallet Demo: EVM ↔ Midnight Integration
        </h2>
        <span className={`collapse-arrow ${isCollapsed ? "collapsed" : ""}`}>
          ▼
        </span>
      </div>

      {!isCollapsed && (
        <div className="wallet-demo-content">
          <div className="wallet-demo-intro">
            <p>
              Demonstrating the power of EVM wallets + Midnight wallets running
              across different blockchains with synchronized token management.
            </p>
          </div>

          <div className="wallets-container">
            {/* EVM Wallet Section */}
            <div className="evm-wallet-section">
              <h3 className="wallet-section-title evm-title">EVM Blockchain</h3>

              <div className="wallet-info">
                <div className="current-wallet">
                  <span className="wallet-label">Current Wallet:</span>
                  <span className="wallet-address evm-address">
                    {evmWallet
                      ? `${evmWallet.address.slice(0, 8)}...${
                        evmWallet.address.slice(-6)
                      }`
                      : "No wallet connected"}
                  </span>
                </div>

                <button
                  onClick={generateNewEVMWallet}
                  className="wallet-button evm-button"
                >
                  Create New EVM Wallet
                </button>
              </div>

              {evmWallet && (
                <div className="token-creation">
                  <div className="token-input-group">
                    <input
                      type="text"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="Enter ERC721 token name"
                      className="token-name-input evm-input"
                    />
                    <button
                      onClick={createERC721Token}
                      className="wallet-button evm-button"
                      disabled={!tokenName.trim()}
                    >
                      CREATE ERC721 Token
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Midnight Wallet Section */}
            <div className="midnight-wallet-section">
              <h3 className="wallet-section-title midnight-title">
                Midnight Blockchain
              </h3>

              <div className="wallet-info">
                <div className="current-wallet">
                  <span className="wallet-label">Current Wallet:</span>
                  <span className="wallet-address midnight-address">
                    {midnightWallet?.connected
                      ? `${midnightWallet.address.slice(0, 12)}...${
                        midnightWallet.address.slice(-8)
                      }`
                      : "No wallet connected"}
                  </span>
                </div>

                <button
                  onClick={connectMidnightWallet}
                  className="wallet-button midnight-button"
                >
                  Connect Midnight Wallet
                </button>
              </div>

              {midnightWallet?.connected && selectedToken && (
                <div className="property-addition">
                  <h4 className="property-title">Add Token Properties</h4>
                  <div className="property-input-group">
                    <input
                      type="text"
                      value={propertyKey}
                      onChange={(e) => setPropertyKey(e.target.value)}
                      placeholder="Property name (e.g., size, color)"
                      className="property-input midnight-input"
                    />
                    <input
                      type="text"
                      value={propertyValue}
                      onChange={(e) => setPropertyValue(e.target.value)}
                      placeholder="Property value (e.g., 300, red)"
                      className="property-input midnight-input"
                    />
                    <button
                      onClick={addProperty}
                      className="wallet-button midnight-button"
                      disabled={!propertyKey.trim() || !propertyValue.trim()}
                    >
                      Add Property
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tokens Table */}
          {tokens.length > 0 && (
            <div className="tokens-table-container">
              <h3 className="table-title">ERC721 Tokens & Properties</h3>
              <div className="tokens-table-wrapper">
                <table className="tokens-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Token Name</th>
                      <th>Owner</th>
                      <th>Properties</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((token) => (
                      <tr
                        key={token.id}
                        className={selectedToken === token.id
                          ? "selected-token"
                          : ""}
                      >
                        <td>
                          <input
                            type="radio"
                            name="selectedToken"
                            checked={selectedToken === token.id}
                            onChange={() => setSelectedToken(token.id)}
                            className="token-selector"
                          />
                        </td>
                        <td className="token-name">{token.name}</td>
                        <td className="token-owner">
                          {token.owner.slice(0, 8)}...{token.owner.slice(-6)}
                        </td>
                        <td className="token-properties">
                          {Object.entries(token.properties).length === 0
                            ? (
                              <span className="no-properties">
                                No properties
                              </span>
                            )
                            : (
                              <div className="properties-list">
                                {Object.entries(token.properties).map((
                                  [key, value],
                                ) => (
                                  <span key={key} className="property-tag">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            )}
                        </td>
                        <td className="token-created">
                          {token.createdAt.toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <style>
        {`
          .wallet-demo-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
            margin-top: 30px;
            position: relative;
          }

          .wallet-demo-notifications {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .wallet-demo-notification {
            padding: 12px 16px;
            border-radius: 8px;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            animation: slideInRight 0.3s ease-out;
            color: white;
          }

          .wallet-demo-notification.success {
            background: #10b981;
          }

          .wallet-demo-notification.error {
            background: #ef4444;
          }

          .wallet-demo-notification.info {
            background: #3b82f6;
          }

          .notification-title {
            font-weight: 600;
            margin-bottom: 4px;
          }

          .notification-message {
            font-size: 14px;
            opacity: 0.9;
          }

          .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            margin-left: 12px;
            opacity: 0.7;
          }

          .wallet-demo-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            padding: 25px 30px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          }

          .wallet-demo-title {
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(45deg, #1e3a8a, #0a1a2e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0;
          }

          .collapse-arrow {
            font-size: 18px;
            color: #666;
            transition: transform 0.2s ease-in-out;
          }

          .collapse-arrow.collapsed {
            transform: rotate(-90deg);
          }

          .wallet-demo-content {
            padding: 30px;
          }

          .wallet-demo-intro {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(30, 58, 138, 0.1);
            border-radius: 10px;
            color: #555;
            font-style: italic;
          }

          .wallets-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }

          .evm-wallet-section {
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border: 2px solid #6b7280;
            border-radius: 15px;
            padding: 25px;
            color: #0f172a;
          }

          .midnight-wallet-section {
            background: linear-gradient(135deg, #0f172a, #1e293b);
            border: 2px solid #64748b;
            border-radius: 15px;
            padding: 25px;
            color: #f0f9ff;
          }

          .wallet-section-title {
            font-size: 1.4rem;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
            padding: 12px;
            border-radius: 8px;
            /* Reset any inherited text effects */
            -webkit-background-clip: initial;
            background-clip: initial;
            -webkit-text-fill-color: initial;
            text-shadow: none;
            border-bottom: none;
          }

          .wallet-section-title.evm-title {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            color: #0f172a;
            border: 2px solid #6b7280;
            font-weight: 700;
          }

          .wallet-section-title.midnight-title {
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color: #f0f9ff;
            border: 2px solid #64748b;
            font-weight: 700;
          }

          .wallet-info {
            margin-bottom: 20px;
          }

          .current-wallet {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 8px;
          }

          .evm-wallet-section .current-wallet {
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid #6b7280;
          }

          .midnight-wallet-section .current-wallet {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid #64748b;
          }

          .wallet-label {
            font-weight: 600;
          }

          .evm-wallet-section .wallet-label {
            color: #0f172a;
          }

          .midnight-wallet-section .wallet-label {
            color: #f0f9ff;
          }

          .wallet-address {
            font-family: monospace;
            font-size: 0.9rem;
            padding: 5px 10px;
            border-radius: 4px;
          }

          .evm-address {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #6b7280;
            font-weight: 600;
          }

          .midnight-address {
            background: #1e293b;
            color: #e2e8f0;
            border: 1px solid #64748b;
            font-weight: 600;
          }

          .wallet-button {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .evm-button {
            background: linear-gradient(45deg, #3b82f6, #2563eb);
            color: white;
          }

          .evm-button:hover {
            background: linear-gradient(45deg, #2563eb, #1d4ed8);
            transform: translateY(-2px);
          }

          .evm-button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
          }

          .midnight-button {
            background: linear-gradient(45deg, #666, #333);
            color: #f0f0f0;
          }

          .midnight-button:hover {
            background: linear-gradient(45deg, #777, #444);
            transform: translateY(-2px);
          }

          .midnight-button:disabled {
            background: #555;
            cursor: not-allowed;
            transform: none;
          }

          .token-creation, .property-addition {
            margin-top: 20px;
          }

          .token-input-group, .property-input-group {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
          }

          .token-name-input, .property-input {
            padding: 10px;
            border-radius: 6px;
            border: 2px solid;
            font-size: 0.9rem;
          }

          .evm-input {
            border-color: #6b7280;
            background: #ffffff;
            color: #0f172a;
          }

          .evm-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .midnight-input {
            border-color: #64748b;
            background: #1e293b;
            color: #f0f9ff;
          }

          .midnight-input:focus {
            outline: none;
            border-color: #94a3b8;
            box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.1);
          }

          .property-title {
            color: #f0f9ff;
            margin-bottom: 15px;
            font-size: 1.1rem;
            font-weight: 600;
          }

          .tokens-table-container {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(31, 38, 135, 0.2);
            border: 1px solid rgba(30, 58, 138, 0.2);
          }

          .table-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 20px;
            text-align: center;
            padding: 15px;
            background: rgba(30, 58, 138, 0.1);
            border-radius: 8px;
          }

          .tokens-table-wrapper {
            overflow-x: auto;
          }

          .tokens-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }

          .tokens-table th {
            background: linear-gradient(45deg, #1e3a8a, #0a1a2e);
            color: white;
            font-weight: 600;
            padding: 15px;
            text-align: left;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .tokens-table td {
            padding: 15px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 0.9rem;
            color: #555;
          }

          .tokens-table tr:hover td {
            background: rgba(30, 58, 138, 0.05);
          }

          .tokens-table tr.selected-token td {
            background: rgba(59, 130, 246, 0.1);
            border-left: 4px solid #3b82f6;
          }

          .token-selector {
            transform: scale(1.2);
          }

          .token-name {
            font-weight: 600;
            color: #1e3a8a;
          }

          .token-owner {
            font-family: monospace;
            color: #666;
          }

          .token-properties {
            max-width: 400px;
          }

          .no-properties {
            color: #999;
            font-style: italic;
          }

          .properties-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            max-height: 120px;
            overflow-y: auto;
          }

          .property-tag {
            background: rgba(30, 58, 138, 0.1);
            color: #1e3a8a;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            border: 1px solid rgba(30, 58, 138, 0.2);
            white-space: nowrap;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: 500;
          }

          .property-tag:hover {
            background: rgba(30, 58, 138, 0.15);
            transform: scale(1.02);
            transition: all 0.2s ease;
          }

          .token-created {
            color: #888;
            font-size: 0.8rem;
          }

          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @media (max-width: 768px) {
            .wallets-container {
              grid-template-columns: 1fr;
            }
            
            .token-input-group, .property-input-group {
              flex-direction: column;
              align-items: stretch;
            }
            
            .wallet-demo-title {
              font-size: 1.4rem;
            }
          }
        `}
      </style>
    </div>
  );
}
