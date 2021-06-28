const express = require('express');
const tagsRouter = express.Router();

tagsRouter.use((req, res, next) => {
    console.log("A request is being made to /tags");

    next();
});

const { getPostsByTagName } = require('../db');

tagsRouter.get('/:tagName/posts', async (req, res) => {
    // const tags = await getAllTags();
    const { tagName } = req.params

    try {
        const postByTag= await getPostsByTagName(tagName)
        const posts = postByTag.filter(post => {
            if (post.active && (req.user && post.author.id === req.user.id)) {
                return true;
            } else {
                return false;
            }
        });
        res.send({ post: posts })
    } catch ({ name, message }) {
        next({ name,message });
    }

    
    // res.send({
    //     tags
    // });
});

module.exports = tagsRouter;