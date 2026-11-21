import { useCallback, useEffect, useState } from "react";
import axios from "../../helper/api";
import { errorMessage, getUser } from "../../helper/session";
import { Alert, Card, PageHeader, Table, inputClass } from "../../components/ui";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const ROLES = ["admin", "manager", "planner", "supervisor", "agent"];

const UsersPage = () => {
  const me = getUser();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get<User[]>("/users");
      setUsers(data);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (u: User, role: string) => {
    try {
      await axios.patch(`/users/${u.id}/role`, { role });
      setOk(`${u.name} is now ${role}. They must log in again for it to take effect.`);
      setError("");
      load();
    } catch (e) {
      setOk("");
      setError(errorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Users & Roles" subtitle="New signups start as agents. Promote people to give them more access." />
      {error && <Alert>{error}</Alert>}
      {ok && <Alert kind="success">{ok}</Alert>}

      <Card>
        <Table head={["Name", "Email", "Role"]} empty={users.length === 0 ? "No users." : undefined}>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-3 py-2 font-medium">{u.name}</td>
              <td className="px-3 py-2">{u.email}</td>
              <td className="px-3 py-2">
                <select
                  className={`${inputClass} !w-40 capitalize`}
                  value={u.role}
                  disabled={u.id === me?.id}
                  onChange={(e) => changeRole(u, e.target.value)}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};

export default UsersPage;
