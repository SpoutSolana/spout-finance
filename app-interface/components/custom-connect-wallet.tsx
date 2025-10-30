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
import { useAptosWallet } from "@/hooks/aptos/useAptosWallet";
// import { useNetwork } from "@/context/NetworkContext";

const CustomConnectButton = () => {
  // const { checkAndSwitchNetwork } = useNetwork();
  const { isConnected, address, connect, disconnect, isConnecting } = useAptosWallet();

  // Automatically switch to Pharos when wallet connects
  // useEffect(() => {
  //   if (isConnected) {
  //     checkAndSwitchNetwork().catch((error: Error) => {
  //       console.error("Failed to switch network in connect button:", error);
  //     });
  //   }
  // }, [isConnected, checkAndSwitchNetwork]);
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div>
      {(() => {
        const connected = isConnected && Boolean(address);

        const handleLogout = async () => {
          // await checkAndSwitchNetwork();
          await disconnect();
        };
          if (!connected) {
            return (
              <button
                onClick={connect}
                className="text-white text-sm focus:outline-none hover:text-white bg-black cursor-pointer rounded-none px-3 py-2 transition-colors border border-gray-600/50 hover:border-emerald-700 hover:!bg-emerald-700"
              >
                {isConnecting ? "Connecting…" : "Connect Wallet"}
              </button>
            );
          }

          return (
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
          );
        })()}
    </div>
  );
};

export default CustomConnectButton;
