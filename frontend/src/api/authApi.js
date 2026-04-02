import axiosClient from './axiosClient';

const authApi = {
    login: (credentials) => axiosClient.post('/auth/signin', credentials),
    register: (userData) => axiosClient.post('/auth/signup', userData),
    logout: () => axiosClient.post('/auth/logout'),
};

export default authApi;
