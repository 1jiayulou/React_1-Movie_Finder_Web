import React, {useState, useEffect} from 'react';
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

const App = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [trendingMovies, setTrendingMovies] = useState([]);

    useDebounce(()=> setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

    const API_BASE_URL = "https://api.themoviedb.org/3";
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const API_OPTIONS = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${API_KEY}`
        }
    };
    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMsg("");
        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=1`
                : `${API_BASE_URL}/discover/movie?page=1&sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.Response === 'False') {
                setErrorMsg(data.Error || "An error occurred while fetching data.");
                setMovieList([]);
                return;
            }
            setMovieList(data.results || []);
            updateSearchCount(query, data.results[0]);
        } catch (error) {
            console.error(`Error: ${error}`);
            setErrorMsg("An error occurred while fetching data.");
        } finally {
            setIsLoading(false);
        }

    }

    const loadTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies();
            setTrendingMovies(movies);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    
    return (
        <main>
            <div className="pattern" />
            <div className="wrapper">
                <header>
                    <img src="/hero.png" alt="hero" />
                    <h1>Find <span className="text-gradient">Movie</span> You'll Enjoy Without the Hassle</h1>
                    <Search searchTerm = {searchTerm} setSearchTerm={setSearchTerm}></Search>
                </header>
                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key = {movie.$id}>
                                    <p>{index+1}</p>
                                    <img src={movie.poster_url} alt="movie.title" />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <section className="all-movies">
                    <h2>All Movies</h2>
                    {isLoading ? (
                        <Spinner/>
                    ) : errorMsg ? (
                        <p className="text-red-500">{errorMsg}</p>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard key={movie.id} movie = {movie}/>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
};

export default App;