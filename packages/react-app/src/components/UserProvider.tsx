import * as React from "react";
import { Dictionary, isEmpty, keyBy, map } from "lodash";
import { ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { createContext, Dispatch } from "react";
import { MaterialItem } from "./Card";
import { useReadContractRequest, useRequest, useWeb3Info } from "abi-to-request";
import { useLoading } from "./Loading";
import { PixelsMetaverse_Material } from "../client/PixelsMetaverse";
import { useQuery } from "@apollo/client";
import { COMPOSE_LIST, MATERIAL_LIST } from "../gql";

export const UserInfoContext = createContext(
  {} as {
    userInfo: any;
    getUserInfo: (params?: {
      addressParams1: string;
    } | undefined) => Promise<{
      successValue: {
        id: string;
        avater: string;
        role: string;
        other: string;
      } | undefined;
      failError?: undefined;
    } | {
      failError: any;
      successValue?: undefined;
    } | undefined>
    getMaterialInfo: (params?: { id: string | number; } | undefined) => Promise<any>,
    materialList: MaterialItem[];
    setMaterialList: Dispatch<React.SetStateAction<MaterialItem[]>>
    collectList: string[] | undefined;
    getCollectList: (params?: {
      from: string;
    } | undefined) => Promise<{
      successValue: string[] | undefined;
      failError?: undefined;
    } | {
      failError: any;
      successValue?: undefined;
    } | undefined>
    getMaterialLength: (params?: unknown) => Promise<{
      successValue: string | undefined;
      failError?: undefined;
    } | {
      failError: any;
      successValue?: undefined;
    } | undefined>,
    getMaterialList: () => Promise<void>,
    materialId?: number;
    setMaterialId: Dispatch<React.SetStateAction<number | undefined>>;
    composeList: string[];
    setComposeList: Dispatch<React.SetStateAction<string[]>>;
    materialListObj: Dictionary<MaterialItem>;
    setMaterialListObj: React.Dispatch<React.SetStateAction<Dictionary<MaterialItem>>>
  },
);

export const useUserInfo = () => useContext(UserInfoContext);

const arrayToObject = (item: MaterialItem) => {
  return {
    baseInfo: {
      category: item?.baseInfo?.category,
      data: item?.baseInfo?.data,
      decode: item?.baseInfo?.decode,
      name: item?.baseInfo?.name,
      userId: item?.baseInfo?.userId,
    },
    composes: item?.composes,
    material: {
      compose: item?.material?.compose,
      data: item?.material?.data,
      id: item?.material?.id,
      owner: item?.material?.owner,
      position: item?.material?.position,
      time: item?.material?.time,
      zIndex: item?.material?.zIndex,
    },
    composeData: []
  }
}

export const UserInfoProvider = ({ children }: { children: ReactNode }) => {
  const [materialList, setMaterialList] = useState<MaterialItem[]>([]);
  const [materialListObj, setMaterialListObj] = useState<Dictionary<MaterialItem>>({});
  const [materialId, setMaterialId] = useState<number | undefined>();
  const [composeList, setComposeList] = React.useState<string[]>([])
  const [composes, setComposes] = React.useState<string[]>([])
  const { openLoading, closeDelayLoading } = useLoading()
  const { address, chainId } = useWeb3Info()
  //const [userInfo, getUserInfo] = useReadContractRequest(PixelsMetaverse_Material, { arg: address ? { uint256Params1: address } : undefined })
  //const [collectList, getCollectList] = useReadContractRequest(PixelsMetaverse_Material, { arg: address ? { uint256Params1: address } : undefined })
  //const [materialLength, getMaterialLength] = useReadContractRequest(PixelsMetaverse_Material)
  //const [getMaterialInfo] = useRequest(PixelsMetaverse_Material, { isGlobalTransactionHookValid: false })

  /*  const getMaterialList = useCallback(async () => {
     openLoading()
     const arr: MaterialItem[] = []
     for (let i = Number(materialLength); i >= 1; i--) {
       const res = await getMaterialInfo({ id: i })
       if (res?.successValue) arr.push(arrayToObject(res?.successValue as MaterialItem))
       if (res?.failError) {
         console.log(res?.failError, i, "error")
       }
     }
     closeDelayLoading()
     setMaterialList(arr)
   }, [getMaterialInfo, materialLength])
  */
  /* useEffect(() => {
    if (Number(materialLength) && chainId) getMaterialList()
  }, [materialLength, chainId]) */

  const materialListsRes = useQuery(MATERIAL_LIST, {
    variables: {
      first: 20,
      orderDirection: 'asc',
      createID: 20,
    },
    //pollInterval: 10000
  })

  const getComposeList = useQuery(COMPOSE_LIST, {
    variables: { ids: composes },
    skip: composes?.length === 0
  })

  console.log(getComposeList?.data?.materials)

  useEffect(() => {
    const data = materialListsRes?.data?.materials
    if (data?.length > 0) {
      const composes: string[] = []
      const list = map(data, item => {
        composes.push(...(item?.composes || []))
        return {
          composes: [],
          material: {
            id: item?.id,
            compose: "0",
            time: "time",
            position: "position",
            zIndex: "zIndex",
            owner: item?.owner,
            data: item?.dataBytes
          },
          baseInfo: {
            data: item?.rawData,
            category: "category",
            decode: "decode",
            name: "name",
            userId: "userId"
          },
          composeData: []
        }
      })
      setMaterialList(list);
      setComposes([])
    }
  }, [materialListsRes.data?.materials])

  useEffect(() => {
    if (isEmpty(materialList)) return
    //if (materialList?.length !== Number(materialLength)) return
    const obj: Dictionary<MaterialItem> = keyBy(materialList, (item: MaterialItem) => item?.material?.id);
    const getData = (items: MaterialItem) => {
      const data: MaterialItem[] = []
      const fun = (item: MaterialItem) => {
        if (item?.composes?.length === 0) return
        map(item?.composes, (ite: number) => {
          if (obj[ite]) data.push(obj[ite])
          fun(obj[ite])
        })
      }
      fun(items)
      return data
    }
    map(materialList, (item: MaterialItem) => {
      const data = getData(item)
      if (isEmpty(data)) obj[item?.material?.id].composeData = [item]
      obj[item?.material?.id].composeData = data;
    })
    setMaterialListObj(obj)
  }, [materialList])

  const getUserInfo: any = () => { }
  const getMaterialInfo: any = () => { }
  const getMaterialList: any = () => { }
  const userInfo: any = {}

  return (
    <UserInfoContext.Provider value={{
      getMaterialInfo,
      getMaterialList,
      userInfo, getUserInfo,
      materialList, setMaterialList,
      materialId, setMaterialId,
      composeList, setComposeList,
      materialListObj, setMaterialListObj
    } as any}>
      {children}
    </UserInfoContext.Provider>
  )
}