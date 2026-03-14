import axiosClient from './axiosClient';

const reportApi = {
    createReport: (reportData) => axiosClient.post('/reports', reportData),
    getReports: () => axiosClient.get('/reports'),
};

export default reportApi;
