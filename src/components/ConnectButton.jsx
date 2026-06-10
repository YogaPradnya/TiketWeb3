"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useAccount, useBalance, useConnect, useDisconnect } from "wagmi";

function truncateAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4).toUpperCase()}`;
}

function subscribeToWalletEvents(callback) {
  window.ethereum?.on?.("connect", callback);
  window.ethereum?.on?.("disconnect", callback);
  window.ethereum?.on?.("accountsChanged", callback);

  return () => {
    window.ethereum?.removeListener?.("connect", callback);
    window.ethereum?.removeListener?.("disconnect", callback);
    window.ethereum?.removeListener?.("accountsChanged", callback);
  };
}

function getMetaMaskSnapshot() {
  return Boolean(window.ethereum?.isMetaMask);
}

function getServerMetaMaskSnapshot() {
  return false;
}

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const hasMetaMask = useSyncExternalStore(
    subscribeToWalletEvents,
    getMetaMaskSnapshot,
    getServerMetaMaskSnapshot
  );

  const walletConnector = useMemo(
    () => connectors.find((connector) => connector.id === "injected" || connector.id === "metaMask") ?? connectors[0],
    [connectors]
  );

  const { data: balance } = useBalance({ address, query: { enabled: isConnected } });

  if (!hasMetaMask) {
    return (
      <a
        id="install-metamask-link"
        className="inline-flex h-10 items-center justify-center rounded-full bg-[#FCD535] px-6 text-sm font-semibold text-[#181a20] hover:bg-[#f0b90b]"
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
      >
        Install MetaMask
      </a>
    );
  }

  if (isConnected) {
    const balanceFormatted = balance
      ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
      : null;

    return (
      <div className="flex items-center gap-3">
        {balanceFormatted && (
          <span className="font-[var(--font-jetbrains-mono)] text-xs font-medium text-[#707a8a]">
            {balanceFormatted}
          </span>
        )}
        <button
          id="disconnect-wallet-button"
          className="h-10 rounded-full bg-[#FCD535] px-6 font-[var(--font-jetbrains-mono)] text-sm font-semibold text-[#181a20] hover:bg-[#f0b90b]"
          type="button"
          onClick={() => disconnect()}
          title="Disconnect wallet"
        >
          {truncateAddress(address)}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        id="connect-wallet-button"
        className="h-10 rounded-full bg-[#FCD535] px-6 text-sm font-semibold text-[#181a20] hover:bg-[#f0b90b] disabled:cursor-not-allowed disabled:bg-[#3a3a1f] disabled:text-[#707a8a]"
        type="button"
        disabled={isPending || !walletConnector}
        onClick={() => walletConnector && connect({ connector: walletConnector })}
      >
        {isPending ? "Connecting..." : "Connect Wallet"}
      </button>
      {error ? <p className="max-w-56 text-right text-xs text-[#f6465d]">{error.shortMessage || error.message}</p> : null}
    </div>
  );
}
