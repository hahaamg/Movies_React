import { Client, Databases, ID, Query } from 'appwrite';

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATASET_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

// get access to appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject(PROJECT_ID); // Your project ID

// apprwrite database
const database = new Databases(client);


export const updateSearchCount = async (searchTerm, movie) => {
    //1. Use Appwrite SDK to check if the search term exists in the database
    try{
        const result = await database.listDocuments(DATASET_ID, COLLECTION_ID, [
            Query.equal('searchTerm', searchTerm),
        ]);
        //2. If it exists, update the count
        if (result.documents.length > 0) {
            const doc = result.documents[0];
            const newCount = result.documents[0].count + 1;
            await database.updateDocument(DATASET_ID, COLLECTION_ID, doc.$id, {
                count: doc.count + 1,
            });
        //3. If it doesn't exist, create a new document with count = 1
        }else{
            await database.createDocument(DATASET_ID, COLLECTION_ID, ID.unique(), {
                searchTerm,
                count: 1,
                movie_id: movie.id,
                poster_url: `https://image.tmdb.org/t/p/w500/${movie.poster_path}`,
            });
        }
    
    }catch (error) {
        console.error(`Error updating search count: ${error}`); }
}

export const getTrendingMovies = async () => {
    try{
        const result = await database.listDocuments(DATASET_ID, COLLECTION_ID, [
            Query.orderDesc('count'),
            Query.limit(5),
        ]);
        return result.documents;
    }catch (error) {
        console.error(`Error fetching trending movies: ${error}`);
    }
}

