import { filter, isEmpty, map } from "lodash";
import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import { AvatarCard } from "../../../components/AvatarCard";
import { DataStateBox } from "../../../components/DataStateBox";
import { NoData } from "../../../components/NoData";
import { useUserInfo } from "../../../components/UserProvider";

export const Collection = () => {
  const history = useHistory()
  const { goodsList } = useUserInfo()
  const shopGoods = useMemo(() => filter(goodsList, item => item?.isSale), [goodsList])

  return (
    <div className="border m-4 p-4 card" style={{ boxShadow: "5px 5px 10px rgba(225,225,225,0.3)" }}>
      <div className="mb-2 flex justify-between">
        <div>收藏夹</div>
        <div className="cursor-pointer hover:text-red-500" onClick={() => { history.push("/lockers") }}>去收藏更多</div>
      </div>
      <DataStateBox data={shopGoods}>
        <div className="overflow-y-scroll" style={{ height: "calc(100% - 30px)" }}>
          {map(shopGoods, item => <AvatarCard key={item?.id} item={item} type={"homeBuyGoods"} />)}
        </div>
      </DataStateBox>
    </div>
  );
};