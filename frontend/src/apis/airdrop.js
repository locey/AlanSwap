import axios from "axios";

const API_BASE_URL = `http://729vl816hh78.vicp.fun/api/v1`;

export async function getAirdropOverview(params) {
  const response = await axios.get(`${API_BASE_URL}/airdrop/overview`, {
    params,
  });
  return response?.data;
}

export async function getAirdropAvailable(params) {
  const response = await axios.get(`${API_BASE_URL}/airdrop/available`, {
    params,
  });
  return response?.data;
}

export async function getAirdropRanking(params) {
  const response = await axios.post(`${API_BASE_URL}/airdrop/ranking`, params);
  return response?.data;
}

export async function claimReward(params) {
  const response = await axios.post(
    `${API_BASE_URL}/airdrop/claimReward`,
    params
  );
  return response?.data;
}

export async function getUserTasks(params) {
  const response = await axios.post(`${API_BASE_URL}/userTask/list`, {
    params,
  });
  return response?.data;
}
