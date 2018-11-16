const route = require('express').Router();

const { Article, Tags }  = require('../db/index');
const { ensureTokenInHeader } = require('../middlewares');
const { getIdFromToken } = require('../services/jwt');
const { createSlug } = require('../services/slugService');
const { generateUUID } = require('../services/uuidService');

route.post('/', ensureTokenInHeader, async (req, res) => {

  const decryptedToken = getIdFromToken(req.headers.token);
  if(decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  } else {
    const { title, description, body, tagList } = req.body.article;
    const authorId = decryptedToken.id;
    const slug = createSlug(title);
    const article_id = generateUUID();

    try {

      const article = await Article.create({
        article_id,
        title,
        description,
        body,
        slug
      })

      await article.setAuthor(authorId)
      const author = await article.getAuthor();

      if(tagList) {
        for(let tag of tagList) {
          const newTag = await Tags.findOrCreate({
            where: {
              tagName: tag
            }
          })
          await article.addTag(newTag[0])
        }
      }

      return res.status(200).json({
        article: {
          slug,
          title,
          description,
          body,
          tagList,
          createdAt: article.dataValues.createdAt,
          updatedAt: article.dataValues.updatedAt,
          favorited: false,
          favoritesCount: 0,
          author: {
            username: author.dataValues.username,
            bio: author.dataValues.bio,
            image: author.dataValues.image,
            following: false
          }
        }
      })

    } catch(err) {
      return res.status(500).json({
        errors: {
          message: err.message
        }
      })
    }

  }
})

module.exports = route;
