"use client";

import { useMutation } from "@tanstack/react-query";
import { Lock, Unlock, ShieldCheck, Coins, MoreHorizontal } from "lucide-react";
import { formatUnits } from "viem";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

interface AccessGateProps {
  token: string;
  address: string;
  chainId: number;
}

interface AccessCheckResponse {
  ok: boolean;
  balance: string;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export function AccessGate({ token, address, chainId }: AccessGateProps) {
  const { 
    mutate: checkAccess, 
    data, 
    isPending, 
    error 
  } = useMutation<AccessCheckResponse>({
    mutationKey: ['access-check', address, chainId],
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/access/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          address,
          chainId,
          standard: 'erc20',
          contract: '0x0000000000000000000000000000000000000000',
          minBalance: '100000000000000000', // 0.1 ETH
        })
      });
      return res.json();
    }
  });

  const hasAccess = data?.ok === true;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4" /> GUARANTEED IDENTITY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs truncate opacity-70">{address}</span>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] uppercase">
                  Chain ID: {chainId}
                </Badge>
                {chainId === 11155111 && (
                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px]">
                    SEPOLIA TESTNET
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Coins className="w-4 h-4" /> ASSET VERIFICATION
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-between h-full">
              <div className="text-2xl font-bold font-mono">
                {isPending ? <Skeleton className="h-8 w-24" /> : data ? `${parseFloat(formatUnits(BigInt(data.balance), 18)).toFixed(3)} ETH` : "---"}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">
                Requirement: ≥ 0.1 ETH
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={`overflow-hidden transition-all duration-500 border-2 ${hasAccess ? 'border-primary' : 'border-muted'}`}>
        <div className={`h-1 w-full transition-all duration-1000 ${hasAccess ? 'bg-primary' : 'bg-muted'}`} />
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                {hasAccess ? <Unlock className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5" />}
                {hasAccess ? "Gated Area Unlocked" : "Gated Area Locked"}
              </CardTitle>
              <CardDescription>
                {hasAccess ? "You've proven your ownership with Garant." : "Owner verification required to access this resource."}
              </CardDescription>
            </div>
            {!data && !isPending && (
              <button 
                onClick={() => checkAccess()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Verify Assets
              </button>
            )}
            {isPending && <div className="animate-spin"><MoreHorizontal /></div>}
          </div>
        </CardHeader>
        
        <CardContent className="relative min-h-[150px] flex items-center justify-center">
          {!data && !isPending && (
            <div className="text-center space-y-2 opacity-50">
              <Lock className="w-12 h-12 mx-auto mb-4" />
              <p className="text-sm">Click "Verify Assets" to bridge on-chain truth</p>
            </div>
          )}

          {isPending && (
            <div className="space-y-4 w-full">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          )}

          {data && !hasAccess && (
            <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="bg-destructive/10 text-destructive p-3 rounded-full inline-block">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold">Access Denied</h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Your Sepolia balance ({parseFloat(formatUnits(BigInt(data.balance), 18)).toFixed(3)} ETH) 
                is below the required threshold of 0.1 ETH.
              </p>
            </div>
          )}

          {hasAccess && (
            <div className="bg-primary/5 p-8 rounded-lg w-full text-center space-y-4 animate-in zoom-in-95 duration-500">
               <div className="max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-primary">
                    Welcome to the Inner Circle
                  </h3>
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    This message is only visible because Garant successfully verified your 
                    cryptographic proof of ownership on the Sepolia network. 
                    No passwords, no central database—just math.
                  </p>
               </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-mono">
          RPC ERROR: {String(error)}
        </div>
      )}
    </div>
  );
}
