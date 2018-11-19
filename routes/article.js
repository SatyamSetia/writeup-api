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

route.put('/:slug', ensureTokenInHeader, async (req, res) => {
  const decryptedToken = getIdFromToken(req.headers.token);
  if(decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  } else {
    let { title, description, body } = req.body.article;
    let userDetails = undefined;

    try {
      userDetails = await UserDetails.findByPk(decryptedToken.id);
    } catch(err) {
      return res.status(500).json({
          errors: {
            message: err.message
          }
      })
    }

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

    let authorDetails = await article.getAuthor();

    if(authorDetails.user_id !== userDetails.user_id) {
      return res.status(403).json({
        error: {
          message: 'Article can only be updated by author'
        }
      })
    }

    if(title) {
      article.title = title;
      article.slug = createSlug(title);
    }

    if(description) {
      article.description = description;
    }

    if(body) {
      article.body = body;
    }

    try {
      let updatedArticle = await article.save();

      const tags = (await updatedArticle.getTags()).map(tag => {
        return tag.tagName
      })

      updatedArticle = updatedArticle.toJSON();
      updatedArticle.favorited = false;
      updatedArticle.tagList = tags;
      updatedArticle.article_id = undefined;
      updatedArticle.user_id = undefined;
      updatedArticle.author.following = false;

      return res.status(200).json({
        article: updatedArticle
      })
    } catch(err) {
      res.status(500).json({
        errors: {
          message: err.message
        }
      })
    }
  }
})

// route.get('/', (req, res) => {
//   try {
//
//   } catch(err) {
//     return res.status(500).json({
//       errors: {
//         message: err.message
//       }
//     })
//   }
// })

route.post('/:slug/favorite', ensureTokenInHeader, async (req, res) => {
  const decryptedToken = getIdFromToken(req.headers.token);
  if(decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  }

  let userDetails;
  try {
    userDetails = await UserDetails.findByPk(decryptedToken.id);
  } catch(err) {
    return res.status(500).json({
        errors: {
          message: err.message
        }
    })
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

  if(authorDetails.user_id === userDetails.user_id) {
    return res.status(403).json({
      error: {
        message: 'Article can not be favorited by author'
      }
    })
  }

  await article.addFavoritedBy(userDetails);

  let isFollowing = false;
  if(userDetails) {
    isFollowing = await authorDetails.hasFollower(userDetails);
  }

  const tags = (await article.getTags()).map(tag => {
    return tag.tagName
  })

  article = article.toJSON();
  article.favorited = true;
  article.tagList = tags;
  article.article_id = undefined;
  article.user_id = undefined;
  article.author.following = isFollowing;

  return res.status(200).json({
    article
  })
})

route.delete('/:slug/favorite', ensureTokenInHeader, async (req, res) => {
  const decryptedToken = getIdFromToken(req.headers.token);
  if(decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  }

  let userDetails;
  try {
    userDetails = await UserDetails.findByPk(decryptedToken.id);
  } catch(err) {
    return res.status(500).json({
        errors: {
          message: err.message
        }
    })
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

  if(authorDetails.user_id === userDetails.user_id) {
    return res.status(403).json({
      error: {
        message: 'Article can not be unfavorited by author'
      }
    })
  }

  await article.removeFavoritedBy(userDetails);

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

  return res.status(200).json({
    article
  })
})

route.delete('/:slug', ensureTokenInHeader, async (req, res) => {
  const decryptedToken = getIdFromToken(req.headers.token);
  if(decryptedToken.error) {
    return res.status(401).json({
      errors: {
        message: ["Invalid Token"]
      }
    })
  }

  let userDetails;
  try {
    userDetails = await UserDetails.findByPk(decryptedToken.id);
  } catch(err) {
    return res.status(500).json({
        errors: {
          message: err.message
        }
    })
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

  if(authorDetails.user_id !== userDetails.user_id) {
    return res.status(403).json({
      error: {
        message: 'Article can only be deleted by author'
      }
    })
  }

  try {
    await article.destroy()
  } catch(err) {
    return res.status(500).json({
      errors: {
        message: err.message
      }
    })
  }

  return res.sendStatus(202);
})

module.exports = route;
