import { getUser } from "../../helper/session";
import HomePage from "./HomePage";
import MyDashboard from "./MyDashboard";

/** Agents get their personal dashboard; everyone else the company-wide one. */
const HomeSwitch = () => (getUser()?.role === "agent" ? <MyDashboard /> : <HomePage />);

export default HomeSwitch;
