/**
 * RAG Service
 * Frontend service for interacting with RAG APIs
 */

import { authHeader } from '../helpers';

const config = {};
if (process.env.NODE_ENV === 'development') {
    config.apiUrl = "http://localhost:8887";
} else {
    config.apiUrl = "";
}

export const ragService = {
    checkStatus,
    initialize,
    query,
    deleteEmbeddings
};

/**
 * Check if embeddings exist for a dataset
 */
function checkStatus(datasetId) {
    const requestOptions = {
        method: 'GET',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/rag/${datasetId}/status`, requestOptions)
        .then(handleResponse);
}

/**
 * Initialize embeddings for a dataset
 */
function initialize(datasetId) {
    const requestOptions = {
        method: 'POST',
        headers: { 
            ...authHeader(),
            'Content-Type': 'application/json'
        }
    };

    return fetch(`${config.apiUrl}/rag/${datasetId}/initialize`, requestOptions)
        .then(handleResponse);
}

/**
 * Query a dataset using RAG
 */
function query(datasetId, question) {
    const requestOptions = {
        method: 'POST',
        headers: { 
            ...authHeader(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
    };

    return fetch(`${config.apiUrl}/rag/${datasetId}/query`, requestOptions)
        .then(handleResponse);
}

/**
 * Delete embeddings for a dataset
 */
function deleteEmbeddings(datasetId) {
    const requestOptions = {
        method: 'DELETE',
        headers: authHeader()
    };

    return fetch(`${config.apiUrl}/rag/${datasetId}`, requestOptions)
        .then(handleResponse);
}

function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            const error = (data && data.error) || response.statusText;
            return Promise.reject(error);
        }
        return data;
    });
}
