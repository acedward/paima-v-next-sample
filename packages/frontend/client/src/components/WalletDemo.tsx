import { useEffect, useMemo, useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { initialNFTSamples } from "../examples.ts";
import { useWallet } from "../contexts/WalletContext.tsx";

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
  lastModified: Date;
}

interface Notification {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

interface PropertySuggestion {
  key: string;
  value: string;
  description: string;
}

// Property suggestions for easy addition - matched with initial token properties
const PROPERTY_SUGGESTIONS: PropertySuggestion[] = [
  {
    key: "streetAddress",
    value: "123 Main St",
    description: "Street address of the location",
  },
  { key: "zipCode", value: "12345", description: "Postal code" },
  { key: "city", value: "New York", description: "City name" },
  { key: "state", value: "NY", description: "State or region" },
  {
    key: "nearbyLandmark",
    value: "Famous Building",
    description: "Notable nearby landmark",
  },
  {
    key: "cityFoundingDate",
    value: "1800-01-01",
    description: "When the city was founded",
  },
  { key: "rarity", value: "rare", description: "Rarity level of the token" },
  { key: "tokenType", value: "Location Token", description: "Type of token" },
  { key: "condition", value: "mint", description: "Current condition" },
  { key: "color", value: "blue", description: "Primary color theme" },
];

// Random token names from landmarks and creative additions
const RANDOM_TOKEN_NAMES = [
  "Mystic Tower NFT",
  "Golden Gateway Token",
  "Crystal Palace Collectible",
  "Ancient Ruins NFT",
  "Starlight Bridge Token",
  "Diamond Peak Collectible",
  "Thunder Mountain NFT",
  "Emerald Valley Token",
  "Silver Falls Collectible",
  "Phoenix Temple NFT",
  "Dragon's Lair Token",
  "Celestial Garden Collectible",
  "Neon City NFT",
  "Quantum Portal Token",
  "Cyber Fortress Collectible",
  "Ocean Pearl NFT",
  "Desert Oasis Token",
  "Forest Crown Collectible",
  "Moon Base Alpha NFT",
  "Solar Flare Token",
  "Nebula Dreams Collectible",
  "Ice Crystal NFT",
  "Volcano Heart Token",
  "Rainbow Bridge Collectible",
];

// Initial token data with random owners
const generateInitialTokens = (): ERC721Token[] => {
  return [];

  const randomOwners = [
    "0x742d35cc6bbf4c8e3f5a9bd5e5b4b9c3a1234567",
    "0x8ba1f109551bd432803012645a30215e8d2b0b5c",
    "0x5aae5c59d6e6ac0b86d1c2b6b9f5c8d2a7654321",
    "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
  ];

  return initialNFTSamples.map((location, index) => ({
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
    lastModified: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)), // Initially same as creation date
  }));
};

export function WalletDemo() {
  const {
    isConnected: walletConnected,
    address: walletAddress,
    signMessage,
  } = useWallet();

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
  const [animatingTokens, setAnimatingTokens] = useState<Set<string>>(
    new Set(),
  );
  const [animatingProperties, setAnimatingProperties] = useState<Set<string>>(
    new Set(),
  );
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [isAddingProperty, setIsAddingProperty] = useState(false);

  // Generate random token name
  const generateRandomTokenName = () => {
    const randomName =
      RANDOM_TOKEN_NAMES[Math.floor(Math.random() * RANDOM_TOKEN_NAMES.length)];
    setTokenName(randomName);
  };

  // Set random name on component mount
  useEffect(() => {
    generateRandomTokenName();
  }, []);

  // Handle property suggestion click
  const handlePropertySuggestion = (suggestion: PropertySuggestion) => {
    setPropertyKey(suggestion.key);
    setPropertyValue(suggestion.value);
    showNotification(
      "info",
      "Property Suggestion Applied",
      `Set ${suggestion.key} = ${suggestion.value}`,
    );
  };

  // Handle card selection
  const handleCardSelect = (tokenId: string) => {
    setSelectedToken(tokenId);
    // No notification for token selection to avoid spam
  };

  // Memoized property suggestions for each token (stable per token, filtered by missing properties)
  const tokenSuggestions = useMemo(() => {
    const suggestions: Record<string, PropertySuggestion[]> = {};
    tokens.forEach((token) => {
      // Get existing property keys for this token
      const existingKeys = Object.keys(token.properties);

      // Filter out properties that already exist
      const availableSuggestions = PROPERTY_SUGGESTIONS.filter(
        (suggestion) => !existingKeys.includes(suggestion.key),
      );

      // Create a deterministic but unique seed for each token
      const seed = token.id.split("").reduce(
        (acc, char) => acc + char.charCodeAt(0),
        0,
      );

      // Use the seed to create consistent "random" suggestions for each token
      const shuffled = [...availableSuggestions].sort((a, b) => {
        const aHash = (a.key + seed).split("").reduce(
          (acc, char) => acc + char.charCodeAt(0),
          0,
        );
        const bHash = (b.key + seed).split("").reduce(
          (acc, char) => acc + char.charCodeAt(0),
          0,
        );
        return (aHash % 1000) - (bHash % 1000);
      });

      suggestions[token.id] = shuffled.slice(0, 2);
    });
    return suggestions;
  }, [
    tokens.map((t) => `${t.id}:${Object.keys(t.properties).join(",")}`).join(
      "|",
    ),
  ]);

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

  // No longer needed as we use MetaMask connection from header
  // const generateNewEVMWallet = () => { ... }

  const connectMidnightWallet = () => {
    console.log(
      "🌙 [NETWORK] Connecting to Midnight wallet - would connect to Midnight network here",
    );
    // Generate a random Midnight-style address (simulated)
    const randomBytes = Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 256),
    );
    const midnightAddress =
      "mn_shield-addr_undeployed16y2mkt0cnl42vhm0qfrnu0vnrw5rwa0fqck0knwfzmkkl5svpz7sxqquqxmjkvmek6aaavvd95huvde7e5r5yadzj5q7wp7rc2v5kdeu555ekfae";
    // const midnightAddress = "mid1" +
    //   randomBytes.map((b) => b.toString(16).padStart(2, "0")).join("").slice(
    //     0,
    //     56,
    //   );

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

  const createERC721Token = async () => {
    if (!tokenName.trim()) {
      showNotification(
        "error",
        "Missing Token Name",
        "Please enter a token name",
      );
      return;
    }

    if (!walletConnected || !walletAddress) {
      showNotification(
        "error",
        "No Wallet Connected",
        "Please connect your MetaMask wallet first",
      );
      return;
    }

    setIsCreatingToken(true);

    try {
      // Create message to sign for NFT creation
      const tokenData = {
        name: tokenName,
        owner: walletAddress,
        timestamp: Date.now(),
      };

      const messageToSign =
        `Create NFT Token:\nName: ${tokenData.name}\nOwner: ${tokenData.owner}\nTimestamp: ${tokenData.timestamp}`;

      console.log("📝 [WALLET] Requesting signature for NFT creation...");
      showNotification(
        "info",
        "Signature Required",
        "Please sign the message in MetaMask to create the NFT",
      );

      // Request user to sign the message
      const signature = await signMessage(messageToSign);

      console.log(
        `🎨 [NETWORK] Creating new ERC721 token "${tokenName}" with signature - would deploy to EVM network here`,
      );
      console.log("✍️ [SIGNATURE]", signature);

      // Show processing notification and add delay
      showNotification(
        "info",
        "Processing Transaction",
        "Creating your NFT on the blockchain...",
      );

      // Add 2000ms delay to simulate network processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newToken: ERC721Token = {
        id: `token_${Date.now()}`,
        name: tokenName,
        owner: walletAddress,
        properties: {
          signature: signature.slice(0, 20) + "...", // Store partial signature for display
          signedMessage: messageToSign.split("\n")[0], // Store first line of message
        },
        createdAt: new Date(),
        lastModified: new Date(),
      };

      setTokens((prev) => [...prev, newToken]);
      setSelectedToken(newToken.id); // Automatically select the newly created token

      // Add animation for new token
      setAnimatingTokens((prev) => new Set([...prev, newToken.id]));
      setTimeout(() => {
        setAnimatingTokens((prev) => {
          const newSet = new Set(prev);
          newSet.delete(newToken.id);
          return newSet;
        });
      }, 1000); // Remove animation class after 1 second

      generateRandomTokenName(); // Generate new random name for next token
      showNotification(
        "success",
        "ERC721 Token Created",
        `Token "${newToken.name}" created and signed successfully!`,
      );
    } catch (error) {
      console.error("Failed to create token:", error);
      showNotification(
        "error",
        "Token Creation Failed",
        error instanceof Error ? error.message : "Failed to sign message",
      );
    } finally {
      setIsCreatingToken(false);
    }
  };

  const addProperty = async () => {
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

    setIsAddingProperty(true);

    try {
      console.log(
        `🌙 [NETWORK] Adding property ${propertyKey}=${propertyValue} to token ${selectedToken} via Midnight network`,
      );

      // Show processing notification and add delay
      showNotification(
        "info",
        "Processing Property",
        "Adding property to your NFT on Midnight network...",
      );

      // Add 2000ms delay to simulate network processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

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
              lastModified: new Date(),
            };
          }
          return token;
        })
      );

      // Add animation for the property being added
      const propertyAnimationKey = `${selectedToken}-${propertyKey}`;
      setAnimatingProperties((prev) =>
        new Set([...prev, propertyAnimationKey])
      );
      setTimeout(() => {
        setAnimatingProperties((prev) => {
          const newSet = new Set(prev);
          newSet.delete(propertyAnimationKey);
          return newSet;
        });
      }, 800); // Remove animation class after 800ms

      setPropertyKey("");
      setPropertyValue("");
      showNotification(
        "success",
        "Property Added",
        `Added ${propertyKey}=${propertyValue} to token`,
      );
    } catch (error) {
      console.error("Failed to add property:", error);
      showNotification(
        "error",
        "Property Addition Failed",
        "Failed to add property to token",
      );
    } finally {
      setIsAddingProperty(false);
    }
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
                    {walletConnected && walletAddress
                      ? `${walletAddress.slice(0, 8)}...${
                        walletAddress.slice(-6)
                      }`
                      : "No wallet connected"}
                  </span>
                </div>

                <div className="wallet-status">
                  {walletConnected
                    ? "✅ MetaMask Connected"
                    : "❌ Connect MetaMask using the header button"}
                </div>
              </div>

              {walletConnected && (
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
                      onClick={generateRandomTokenName}
                      className="wallet-button evm-button random-name-btn"
                      title="Generate random name"
                    >
                      🎲
                    </button>
                    <button
                      onClick={createERC721Token}
                      className="wallet-button evm-button"
                      disabled={!tokenName.trim() || isCreatingToken}
                    >
                      {isCreatingToken
                        ? (
                          <>
                            <span className="loader"></span>
                            Creating Token...
                          </>
                        )
                        : (
                          "CREATE ERC721 Token"
                        )}
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

                  {/* Property Suggestions */}
                  <div className="property-suggestions">
                    <div className="suggestions-label">Quick suggestions:</div>
                    <div className="suggestions-grid">
                      {PROPERTY_SUGGESTIONS.slice(0, 6).map((suggestion) => (
                        <button
                          key={suggestion.key}
                          onClick={() => handlePropertySuggestion(suggestion)}
                          className="suggestion-button"
                          title={suggestion.description}
                        >
                          {suggestion.key}
                        </button>
                      ))}
                    </div>
                  </div>

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
                      disabled={!propertyKey.trim() || !propertyValue.trim() ||
                        isAddingProperty}
                    >
                      {isAddingProperty
                        ? (
                          <>
                            <span className="loader"></span>
                            Adding Property...
                          </>
                        )
                        : (
                          "Add Property"
                        )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tokens Cards Grid */}
          {tokens.length > 0 && (
            <div className="tokens-cards-container">
              <h3 className="cards-title">ERC721 Tokens & Properties</h3>
              <div className="tokens-cards-grid">
                {tokens
                  .sort((a, b) =>
                    b.lastModified.getTime() - a.lastModified.getTime()
                  )
                  .map((token) => (
                    <div
                      key={token.id}
                      className={`token-card ${
                        selectedToken === token.id ? "selected-card" : ""
                      } ${
                        animatingTokens.has(token.id)
                          ? "new-token-animation"
                          : ""
                      }`}
                      onClick={() => handleCardSelect(token.id)}
                    >
                      <div className="card-header">
                        <div className="card-selection-indicator">
                          {selectedToken === token.id && (
                            <span className="selected-icon">✓</span>
                          )}
                        </div>
                        <h4 className="card-token-name">{token.name}</h4>
                      </div>

                      <div className="card-body">
                        <div className="card-owner">
                          <span className="owner-label">Owner:</span>
                          <span className="owner-address">
                            {token.owner.slice(0, 8)}...{token.owner.slice(-6)}
                          </span>
                        </div>

                        <div className="card-created">
                          <span className="created-label">Created:</span>
                          <span className="created-time">
                            {token.createdAt.toLocaleTimeString()}
                          </span>
                        </div>

                        <div className="card-properties">
                          <div className="properties-header">Properties:</div>
                          {Object.entries(token.properties).length === 0
                            ? (
                              <div className="no-properties-card">
                                <div className="no-properties-text">
                                  No properties yet - try these suggestions:
                                </div>
                                <div className="card-property-suggestions">
                                  {(tokenSuggestions[token.id] || []).map((
                                    suggestion: PropertySuggestion,
                                  ) => (
                                    <button
                                      key={`${token.id}-${suggestion.key}`}
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent card selection
                                        handleCardSelect(token.id); // Select the card first
                                        handlePropertySuggestion(suggestion); // Then apply suggestion
                                      }}
                                      className="card-suggestion-tag"
                                      title={suggestion.description}
                                    >
                                      {suggestion.key}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )
                            : (
                              <div className="properties-grid-card">
                                {Object.entries(token.properties).map((
                                  [key, value],
                                ) => (
                                  <div
                                    key={key}
                                    className={`property-card-tag ${
                                      animatingProperties.has(
                                          `${token.id}-${key}`,
                                        )
                                        ? "new-property-animation"
                                        : ""
                                    }`}
                                  >
                                    <span className="property-key">{key}:</span>
                                    <span className="property-value">
                                      {value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
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
            top: 10px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
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
            pointer-events: auto;
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

          /* Loader styles */
          .loader {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 8px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
            // margin-bottom: 20px;
          }

          .wallet-status {
            text-align: center;
            padding: 10px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 500;
            margin-top: 10px;
          }

          .evm-wallet-section .wallet-status {
            background: rgba(16, 185, 129, 0.1);
            color: #059669;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }

          .current-wallet {
            display: flex;
            justify-content: space-between;
            align-items: center;
            // margin-bottom: 15px;
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
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
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
            background: linear-gradient(45deg, #3b82f6, #2563eb);
            color: white;
          }

          .midnight-button:hover {
            background: linear-gradient(45deg, #2563eb, #1d4ed8);
            transform: translateY(-2px);
          }

          .midnight-button:disabled {
            background: #9ca3af;
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

          .property-suggestions {
            margin-bottom: 20px;
          }

          .suggestions-label {
            color: #f0f9ff;
            font-size: 0.9rem;
            margin-bottom: 10px;
            font-weight: 500;
          }

          .suggestions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 8px;
            margin-bottom: 15px;
          }

          .suggestion-button {
            background: rgba(100, 116, 139, 0.2);
            border: 1px solid #64748b;
            color: #f0f9ff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .suggestion-button:hover {
            background: rgba(100, 116, 139, 0.4);
            border-color: #94a3b8;
            transform: translateY(-1px);
          }

          /* Replace table styles with card styles */
          .tokens-cards-container {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(31, 38, 135, 0.2);
            border: 1px solid rgba(30, 58, 138, 0.2);
          }

          .cards-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 20px;
            text-align: center;
            padding: 15px;
            background: rgba(30, 58, 138, 0.1);
            border-radius: 8px;
          }

          .tokens-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }

          .token-card {
            background: white;
            border: 2px solid rgba(30, 58, 138, 0.2);
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            position: relative;
            min-height: 240px;
          }

          .token-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(30, 58, 138, 0.3);
            border-color: rgba(30, 58, 138, 0.4);
          }

          .token-card.selected-card {
            border-color: #3b82f6;
            background: rgba(59, 130, 246, 0.05);
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          }

          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid rgba(30, 58, 138, 0.1);
          }

          .card-selection-indicator {
            width: 24px;
            height: 24px;
            border: 2px solid #ccc;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }

          .selected-card .card-selection-indicator {
            border-color: #3b82f6;
            background: #3b82f6;
          }

          .selected-icon {
            color: white;
            font-size: 0.8rem;
            font-weight: bold;
          }

          .card-token-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e3a8a;
            margin: 0;
            flex: 1;
            margin-left: 15px;
            text-align: center;
          }

          .card-body {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .card-owner,
          .card-created {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.9rem;
          }

          .owner-label,
          .created-label {
            font-weight: 600;
            color: #555;
          }

          .owner-address {
            font-family: monospace;
            background: rgba(0, 0, 0, 0.05);
            padding: 4px 8px;
            border-radius: 4px;
            color: #666;
            font-size: 0.8rem;
          }

          .created-time {
            color: #888;
            font-size: 0.8rem;
          }

          .card-properties {
            margin-top: 10px;
            flex: 1;
          }

          .properties-header {
            font-weight: 600;
            color: #555;
            margin-bottom: 10px;
            font-size: 0.9rem;
          }

          .no-properties-card {
            text-align: center;
            padding: 15px;
            background: rgba(0, 0, 0, 0.02);
            border-radius: 6px;
            border: 1px dashed #ddd;
          }

          .no-properties-text {
            color: #999;
            font-style: italic;
            font-size: 0.85rem;
            line-height: 1.4;
            margin-bottom: 12px;
          }

          .card-property-suggestions {
            display: flex;
            gap: 8px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .card-suggestion-tag {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 20px;
            padding: 6px 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.85rem;
            font-weight: 500;
            color: #3b82f6;
            white-space: nowrap;
            margin: 2px;
          }

          .card-suggestion-tag:hover {
            background: rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.5);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
            color: #2563eb;
          }

          .properties-grid-card {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 8px;
          }

          .property-card-tag {
            background: rgba(30, 58, 138, 0.1);
            border: 1px solid rgba(30, 58, 138, 0.2);
            border-radius: 8px;
            padding: 8px 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            transition: all 0.2s ease;
            min-height: 50px;
            justify-content: center;
          }

          .property-card-tag:hover {
            background: rgba(30, 58, 138, 0.15);
            transform: scale(1.02);
          }

          .property-key {
            font-weight: 600;
            color: #1e3a8a;
            font-size: 0.8rem;
            margin-bottom: 2px;
          }

          .property-value {
            color: #555;
            font-size: 0.9rem;
            word-break: break-word;
          }

          /* Hide the old table styles when not needed */
          .tokens-table-container {
            display: none;
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

          @keyframes newTokenCreation {
            0% {
              transform: scale(0.8) translateY(-20px);
              opacity: 0;
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            }
            50% {
              transform: scale(1.05) translateY(-5px);
              opacity: 1;
              box-shadow: 0 0 20px 10px rgba(59, 130, 246, 0.3);
            }
            100% {
              transform: scale(1) translateY(0);
              opacity: 1;
              box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            }
          }

          @keyframes newPropertyPulse {
            0% {
              transform: scale(1);
              background: rgba(16, 185, 129, 0.2);
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            50% {
              transform: scale(1.1);
              background: rgba(16, 185, 129, 0.3);
              box-shadow: 0 0 15px 5px rgba(16, 185, 129, 0.4);
            }
            100% {
              transform: scale(1);
              background: rgba(30, 58, 138, 0.1);
              box-shadow: none;
            }
          }

          .new-token-animation {
            animation: newTokenCreation 1s ease-out;
          }

          .new-property-animation {
            animation: newPropertyPulse 0.8s ease-out;
          }

          @media (max-width: 768px) {
            .wallet-demo-notifications {
              top: 5px;
              right: 10px;
              left: 10px;
              width: auto;
            }

            .wallet-demo-notification {
              min-width: auto;
              width: 100%;
            }

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

            .tokens-cards-grid {
              grid-template-columns: 1fr;
              gap: 15px;
            }
            
            .token-card {
              min-height: 200px;
            }
            
            .properties-grid-card {
              grid-template-columns: 1fr 1fr;
            }
            
            .suggestions-grid {
              grid-template-columns: repeat(2, 1fr);
            }

            .card-property-suggestions {
              flex-direction: row;
              justify-content: center;
            }

            .card-suggestion-tag {
              font-size: 0.8rem;
              padding: 5px 10px;
            }
          }

          @media (max-width: 480px) {
            .properties-grid-card {
              grid-template-columns: 1fr;
            }

            .card-property-suggestions {
              gap: 4px;
            }

            .card-suggestion-tag {
              font-size: 0.75rem;
              padding: 4px 8px;
            }
          }
        `}
      </style>
    </div>
  );
}
