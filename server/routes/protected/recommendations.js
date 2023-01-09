const axios = require('axios')
const express = require('express')
const User = require('../../models/userSchema')
const router = express.Router()

function getSafe(elem, language) {
    try {
        // console.log(elem["watch/providers"]['results'][language]['flatrate'], language)
        return elem["watch/providers"]['results'][language]['flatrate']
    } catch (e) {
        return undefined;
    }
}


router.delete("/recommendations/:id", async (req, res, next) => {

    const userDetails = await User.findOne({ sessionToken: req.cookies.token })
    const toRemove = userDetails.recommendations.findIndex((elem) => elem.MovieDBid === Number(req.params.id))
    console.log(toRemove, Number(req.params.id))
    if(toRemove === -1) { res.status(200).send('Already Missing'); return }

    userDetails.recommendations.splice(toRemove, 1)
    await userDetails.save()
    res.sendStatus(200)
    return
})

router.post("/recommendations", async (req, res, next) => {

    const userDetails = await User.findOne({ sessionToken: req.cookies.token })
    const toUpdate = userDetails.recommendations.findIndex((elem) => elem.MovieDBid === Number(req.body.id))
    console.log(toUpdate, req.body, `${process.env.RECOMMENDATIONS_URL}/recommendations`)
    if (toUpdate === -1) { res.status(200).send('Already Missing'); return }
    userDetails.watchedMovies.push(elem.MovieDBid)

    try {
        var response = await axios.get(`${process.env.RECOMMENDATIONS_URL}/recommendations`, {
            params: {
                movieid: req.body.id,
            },
            headers: { "Accept-Encoding": "gzip,deflate,compress" }
        })
    }
    catch (error) {
        if (error.response) {
            res.status(500).send(error.response)
            return next(new Error(error.response.data))
        } else {
            res.sendStatus(500)
            return next(new Error(error))
        }
    }

    for (elem of response.data) {
        console.log(elem.title)
        // If it's already present in the recommendations, continue
        if (userDetails.recommendations.find((dbElem) => dbElem.MovieDBid === elem.id)) { continue }
        // If it has already been watched, continue
        if (userDetails.watchedMovies.find((alreadyWatchedID) => alreadyWatchedID === elem.id)) { continue }
        
        elem.genres = elem.genres.map((elem) => elem.name)
        const providers = getSafe(elem, userDetails.preferences.country.toUpperCase())
        const toAdd = {
            MovieDBid: elem.id,
            title: elem.title,
            overview: elem.overview,
            runtime: elem.runtime,
            genres: elem.genres,
            providers: elem.providers,
            release_date: elem.release_date,
            poster_path: elem.poster_path,
            providers: providers
        }

        // console.log(toAdd)
        userDetails.recommendations.push(toAdd)
    }

    userDetails.recommendations.splice(toUpdate, 1)

    await userDetails.save()
    res.sendStatus(200)
    return
})


module.exports = router