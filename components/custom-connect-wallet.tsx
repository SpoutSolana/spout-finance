import React, { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Copy } from "lucide-react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
// import { useNetwork } from "@/context/NetworkContext";

const CustomConnectButton = () => {
  // const { checkAndSwitchNetwork } = useNetwork();
  const { connected, publicKey, disconnect, connecting, wallet, select, wallets } = useWallet();
  const { setVisible, visible } = useWalletModal();

  // Debug: log wallet adapter state changes
  useEffect(() => {
    console.log("[wallet] state changed:", {
      connected,
      connecting,
      publicKey: publicKey?.toBase58() ?? null,
      walletName: wallet?.adapter?.name ?? null,
      walletReady: wallet?.adapter?.readyState ?? null,
      modalVisible: visible,
    });
  }, [connected, connecting, publicKey, wallet, visible]);

  // Debug: log all detected wallets on mount
  useEffect(() => {
    console.log("[wallet] detected wallets:", wallets.map(w => ({
      name: w.adapter.name,
      readyState: w.adapter.readyState,
      connected: w.adapter.connected,
    })));
  }, [wallets]);

  // Debug: listen to wallet adapter events when a wallet is selected
  useEffect(() => {
    if (!wallet) return;
    const adapter = wallet.adapter;

    const onConnect = () => console.log("[wallet] adapter 'connect' event fired, publicKey:", adapter.publicKey?.toBase58());
    const onDisconnect = () => console.log("[wallet] adapter 'disconnect' event fired");
    const onError = (err: Error) => console.error("[wallet] adapter 'error' event:", err);
    const onReadyChange = (readyState: any) => console.log("[wallet] adapter readyStateChange:", readyState);

    adapter.on("connect", onConnect);
    adapter.on("disconnect", onDisconnect);
    adapter.on("error", onError);
    adapter.on("readyStateChange", onReadyChange);

    console.log("[wallet] attached listeners to adapter:", adapter.name, "readyState:", adapter.readyState);

    return () => {
      adapter.off("connect", onConnect);
      adapter.off("disconnect", onDisconnect);
      adapter.off("error", onError);
      adapter.off("readyStateChange", onReadyChange);
    };
  }, [wallet]);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const address = publicKey?.toBase58();
  const isConnected = connected && Boolean(address);

  const handleLogout = async () => {
    // await checkAndSwitchNetwork();
    await disconnect();
  };

  return (
    <div>
      {!isConnected ? (
        <button
          onClick={() => setVisible(true)}
          className="text-white text-sm focus:outline-none hover:text-white bg-black cursor-pointer rounded-none px-3 py-2 transition-colors border border-gray-600/50 hover:border-emerald-700 hover:!bg-emerald-700"
        >
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex focus:outline-none text-black items-center gap-2 bg-emerald-700/20 hover:bg-emerald-700/35 rounded-none py-0.5 pl-0.5 pr-4 border-0 border-gray-600/50 transition-colors">
              <div className="w-8 h-8 rounded-none">
                <Image
                  src="/1.png"
                  className="w-full h-full"
                  width={32}
                  height={32}
                  alt="Profile_Image"
                />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white">
            <DropdownMenuItem onClick={() => address && copyAddress(address)} className="cursor-pointer">
              <Copy className="mr-2 h-4 w-4" />
              Copy Address
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default CustomConnectButton;
