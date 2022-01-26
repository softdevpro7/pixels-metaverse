import { createContext, ReactNode, useState, useContext, useCallback, useEffect, useMemo } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { getChainData, warning } from "../helpers/utilities";
import { IChainData } from "../helpers/types";
import { isEmpty, isUndefined, omit } from "lodash";
import { ethers } from "ethers";

export type TLibrary = ethers.providers.Web3Provider | ethers.providers.InfuraProvider

interface IWeb3InfoProps {
  connected?: boolean;
  address?: string;
  chainId?: number;
  web3?: Web3;
  library?: TLibrary;
  networkId?: number,
  web3Modal?: Web3Modal,
  addressBalance?: string,
  chainData?: IChainData,
  killSession?: () => void,
  toConnect?: () => void,
}

const INITIAL_STATE: IWeb3InfoProps = {
  address: "",
  web3: undefined,
  library: undefined,
  connected: false,
  chainId: 1,
  networkId: 1
};

export const Web3InfoContext = createContext({} as IWeb3InfoProps);

export const useWeb3Info = () => useContext(Web3InfoContext);

const getProviderOptions = () => {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: "96f99379cbad4a22a3904f9082b58792"
      }
    }
  };
  return providerOptions;
};

export const useGetWeb3Info = () => {
  const [{
    connected,
    address,
    chainId,
    web3,
    library,
    networkId,
    web3Modal,
    chainData,
    addressBalance
  }, setWeb3Info] = useState<IWeb3InfoProps>({})

  const resetApp = async () => {
    try {
      if (library instanceof ethers.providers.Web3Provider && library?.provider instanceof WalletConnectProvider) {
        library?.provider.wc?.killSession()
      }
      await web3Modal?.clearCachedProvider();
      setWeb3Info((pre) => ({ ...pre, ...INITIAL_STATE }));
    } catch (error) {
      console.log(error)
    }
  };

  useEffect(() => {
    if (chainId) {
      const chainData = getChainData(chainId)
      if (!chainData) {
        warning(parseInt(String(chainId)))
      }
      setWeb3Info((pre) => ({ ...pre, chainData: chainData || null }));
    }
  }, [chainId])

  const network = useMemo(() => !isEmpty(chainData) ? chainData?.network : "mainnet", [chainData]);

  useEffect(() => {
    const web3Modal = new Web3Modal({
      network,
      cacheProvider: true,
      providerOptions: getProviderOptions()
    });
    setWeb3Info((pre) => ({ ...pre, web3Modal }));
  }, [network])

  useEffect(() => {
    if (web3Modal?.cachedProvider) {
      toConnect()
    } else {
      toConnect(false)
    }
  }, [web3Modal?.cachedProvider])

  const subscribeProvider = async (provider: any) => {
    if (!provider.on) {
      return;
    }

    provider.on("close", () => resetApp());

    provider.on("accountsChanged", async (accounts: string[]) => {
      await setWeb3Info((pre) => ({ ...pre, address: accounts[0] }));
    });

    provider.on("chainChanged", async (chainId: string) => {
      await setWeb3Info((pre) => ({ ...pre, chainId: parseInt(chainId) }))
    });

    provider.on("networkChanged", async (networkId: string) => {
      await setWeb3Info((pre) => ({ ...pre, networkId: parseInt(networkId) }));
    });
  };

  const getLibrary = async () => {
    if (process.env.NODE_ENV === "production") {
      return new ethers.providers.InfuraProvider('mainnet')
    } else {
      return ethers.getDefaultProvider("http://127.0.0.1:8545") as ethers.providers.Web3Provider;
    }
  }

  const toConnect = async (defaultProvider?: boolean) => {
    let library: TLibrary, address: string, chainId: number, balance: string;
    if (isUndefined(defaultProvider)) {
      try {
        const instance: ethers.providers.ExternalProvider = await web3Modal?.connect();
        await subscribeProvider(instance);
        library = new ethers.providers.Web3Provider(instance);
        const signer = (library as TLibrary).getSigner();
        address = await signer.getAddress();
        const addressBalance = await signer.getBalance();
        balance = ethers.utils.formatUnits(addressBalance);
      } catch (error) {
        library = await getLibrary()
      }
    } else {
      library = await getLibrary()
    }
    const net = await library.getNetwork();
    chainId = net?.chainId;

    setWeb3Info((pre) => ({
      ...pre,
      library,
      connected: true,
      address,
      chainId,
      networkId: chainId,
      addressBalance: balance
    }));
  };

  return {
    connected,
    address,
    chainId,
    killSession: resetApp,
    toConnect,
    web3,
    networkId,
    chainData,
    addressBalance
  }
}

export const Web3InfoProvider = ({ children }: { children: ReactNode }) => {
  const {
    connected,
    address,
    chainId,
    killSession,
    toConnect,
    web3,
    networkId,
    chainData,
    addressBalance
  } = useGetWeb3Info()

  return (
    <Web3InfoContext.Provider value={{
      connected,
      address,
      chainId,
      killSession,
      toConnect,
      web3,
      networkId,
      chainData,
      addressBalance
    }}>
      {children}
    </Web3InfoContext.Provider>
  )
}