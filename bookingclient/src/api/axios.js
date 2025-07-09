import axios from 'axios';

// 1. Create a new axios instance with the base URL of your server.
const instance = axios.create({
    baseURL: '/api',
});

// 2. Set up an interceptor that runs before every single request.
instance.interceptors.request.use(
    (config) => {
        // Inside the interceptor, get the most current user info from localStorage.
        const userInfo = localStorage.getItem('userInfo');
        
        // If it exists, parse it and add the token to the 'Authorization' header.
        if (userInfo) {
            const token = JSON.parse(userInfo).token;
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Return the modified configuration to proceed with the request.
        return config;
    }, 
    (error) => {
        // This is for handling errors during the request setup itself.
        return Promise.reject(error);
    }
);

// 3. Export the configured instance for use throughout your app.
export default instance;