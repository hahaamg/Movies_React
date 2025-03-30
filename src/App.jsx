import React, { use } from 'react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import Search from './components/search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { getTrendingMovies, updateSearchCount } from './appwrite.js';

// TMDB API
// Read documentation at https://developers.themoviedb.org/3/getting-started/introductio
const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers:{
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

function App() {
  // State to store the debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  // State to store the search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // State to store the movies list
  const [moviesList, setMoviesList] = useState([])
  // API error message
  const [errorMessage, setErrorMessage ] = useState('')
  // State to store the loading state
  const [isLoading, setIsLoading] = useState(false)

  // State to store the trending movies
  const [trendingMovies, setTrendingMovies] = useState([]);
  
  // when the search term changes, set the debounced search term
  // delay 1000ms to set search term
  useDebounce(() => {setDebouncedSearchTerm(searchTerm);},1000,[searchTerm]);
  
  const fetchMovies = async (query='') => {
    // setIsLoading to true
    setIsLoading(true);
    // setErrorMessage to empty string
    setErrorMessage('');
    try{
      // encodeURIComponent to encode the query string
      const endpoint = query
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if(!data.results || data.results.length === 0) {
        throw new Error('Failed to fetch movies');
        setMoviesList([]);
        return;
      }
      setMoviesList(data.results || []);
      
      if(query && data.results.length > 0){
        // update search count in appwrite database
        await updateSearchCount(query, data.results[0]);
      }
      //alert(response)
      //throw new Error('Error fetching movies');
    }catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Failed to fetch movies. Please try again later.');
    }finally {
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try{
      const movies = await getTrendingMovies();
      setTrendingMovies(movies)

    }catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
      // Dont set error message here, if trending movie got wrong, it will shoutdown the whole app
      //setErrorMessage('Failed to fetch trending movies. Please try again later.');
  }
  }

  // Fetch movies when the debounced search term changes
  useEffect(() => {
    fetchMovies(searchTerm)
  },[debouncedSearchTerm]);

  // Fetch trending movies when the component mounts
  useEffect(() => {
    loadTrendingMovies();
  },[]);

  return (
    <main>
      <div className='pattern'/>
      <div className='wrapper'>
        <header>
        <img src='./hero.png' alt='hero'/>
          <h1>Find <span className='text-gradient'>Movies</span> You'll Enjoy Without Hassle</h1>
        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>
        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
               <li key={movie.$id}>
                <p>{index+1}</p>
                <img src={movie.poster_url} alt={movie.title} />
               </li>
              ))}
            </ul>
          </section>
        )}
        <section className='all-movies'>
          <h2>All Movies</h2>
          {isLoading ? (<Spinner />) : ( errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul className='movies-list'>
              {moviesList.map((movie) => (
                  <MovieCard key={movie.id} movie={movie}/>
              ))}
            </ul>
          ))}
        </section>
      </div>
    </main>
  );
}

export default App;
