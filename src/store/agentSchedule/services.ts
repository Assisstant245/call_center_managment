import axios from "../../helper/api";
import { GET_SHEDULE_AGENT_API } from "./constraint";

export const getScheduleAgentApi = async () => {
  try {
    

    const response = await axios.get(
      GET_SHEDULE_AGENT_API
    );

    

    return response.data;
  } catch (error: any) {
    console.error(
      "Error in getScheduleAgentApi:",
      error
    );

    console.error(
      "Backend response:",
      error.response?.data
    );

    throw new Error(
      error.response?.data?.message ||
        "Failed to fetch agent schedule"
    );
  }
};