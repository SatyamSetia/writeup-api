const route = require('express').Router();

const { Article, Tags, UserDetails }  = require('../db/index');
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

route.get('/:slug', async (req, res) => {

  let userDetails = undefined;

  if(req.headers.token) {
    const decryptedToken = getIdFromToken(req.headers.token);
    if(decryptedToken.error) {
      return res.status(401).json({
        errors: {
          message: ["Invalid Token"]
        }
      })
    }

    try {
      userDetails = await UserDetails.findByPk(decryptedToken.id);
    } catch(err) {
      return res.status(500).json({
          errors: {
            message: err.message
          }
      })
    }
  }

  let article;

  try {
    article  = await Article.findOne({
      where: {
        slug: req.params.slug
      },
      include: [{
        model: UserDetails,
        as: 'author',
        attributes: ['username','bio','image']
      }]
    })
    if(!article) {
      throw {
        message: 'Article not found'
      }
    }
  } catch(err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }

  const authorDetails = await article.getAuthor();

  let isFollowing = false;
  if(userDetails) {
    isFollowing = await authorDetails.hasFollower(userDetails);
  }

  const tags = (await article.getTags()).map(tag => {
    return tag.tagName
  })

  article = article.toJSON();
  article.favorited = false;
  article.tagList = tags;
  article.article_id = undefined;
  article.user_id = undefined;
  article.author.following = isFollowing;

  res.status(200).json({
    article
  })
})

module.exports = route;
