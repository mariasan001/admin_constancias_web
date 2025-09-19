import { useEffect, useState } from "react";
import {
  listUsersBySubarea,
  setAnalystStatus,
  changeAnalystPassword
} from "@/features/analysts/service";
import type { SubareaUser } from "@/features/analysts/models";

export function useAnalysts(subWorkUnitId?: number) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [onlyAnalysts, setOnlyAnalysts] = useState(true);
  const [rows, setRows] = useState<SubareaUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);

  const [edit, setEdit] = useState<null | SubareaUser>(null);
  const [pwdFor, setPwdFor] = useState<null | SubareaUser>(null);
  const [pwdNew, setPwdNew] = useState("");

  const fetchList = async () => {
    if (!subWorkUnitId) return;
    setLoading(true);
    try {
      const res = await listUsersBySubarea({ subWorkUnitId, q, page, size, onlyAnalysts });
      setRows(res.items);
      setTotalUsers(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, [subWorkUnitId, page, size, onlyAnalysts]);

  const toggleActive = async (u: SubareaUser) => {
    await setAnalystStatus(u.userId, !u.active);
    fetchList();
  };

  const changePwd = async (userId: string) => {
    await changeAnalystPassword(userId, pwdNew);
    setPwdNew("");
    fetchList();
  };

  return {
    rows, totalUsers, loading,
    page, setPage, size, setSize,
    q, setQ, onlyAnalysts, setOnlyAnalysts,
    fetchList, toggleActive,
    edit, setEdit, pwdFor, setPwdFor, pwdNew, setPwdNew, changePwd
  };
}
