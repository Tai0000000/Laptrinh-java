import axiosClient from './axiosClient';

const reportApi = {
    createReport: (reportData) => axiosClient.post('/requests', reportData),
    getMyReports: (page) => axiosClient.get('/requests/my', { params: { page } }),
    getReportDetail: (id) => axiosClient.get(`/requests/${id}`),
};

export default reportApi;
