//this line imports the pg module that was created
const { Client } = require('pg');

//supplies the db name and location of the database
const client = new Client('postgres://localhost:5432/juicebox-dev');


//starting to build helper functions
async function createUser({ 
    username, 
    password, 
    name, 
    location 
}) {
    try {
        const { rows: [ user ] } = await client.query(`
            INSERT INTO users(username, password, name, location)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [username, password, name, location]);

        return user;
    } catch(error) {
        throw error;
    }
}

async function updateUser(id, fields = {}) {
    //build the set string:
    //use map to turn each key into a string with the key name in quotes
    //for case sensitivity purposes. Then we have a parameter with a numeric value
    //one greater than the index of that key
    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');

    //return early if this is called without fields
    if(setString.length === 0) {
        return;
    }
    
    //as long as fields object has something in it (from if statement above),
    //we call the query. We can interpolate id since we pass id when calling updateUser
    try {
        const { rows: [ user ] } = await client.query(`
            UPDATE users
            SET ${ setString }
            WHERE id=${ id }
            RETURNING *;
        `, Object.values(fields));

        return user;
    } catch (error) {
        throw error;
    }
}

async function getAllUsers() {
    try {
        const { rows } = await client.query(
            `SELECT id, username, name, location, active
            FROM users;
        `);
        return rows;
    } catch (error) {
        throw error;
    }

}

async function getUserById(userId) {
    try {
        const { rows: [ user ] } = await client.query(`
        SELECT id, username, name, location, active
        FROM users
        WHERE id=${ userId };
    `);

    if (!user) {
        return null;
    }
    user.posts = await getPostsByUser(userId)
    return user;

    } catch (error) {
        throw error;
    }

}

async function createPost({
    authorId,
    title,
    content,
    tags = [] 
  }) {
    try {
      const { rows: [ post ] } = await client.query(`
        INSERT INTO posts("authorId", title, content) 
        VALUES($1, $2, $3)
        RETURNING *;
      `, [authorId, title, content]);
  
      const tagList = await createTags(tags);
  
      return await addTagsToPost(post.id, tagList);
    } catch (error) {
      throw error;
    }
}

async function updatePost(postId, fields = {}) {
    // read off the tags
    const { tags } = fields; 
    // remove field 
    delete fields.tags;
  
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
    try {
      if (setString.length > 0) {
        await client.query(`
          UPDATE posts
          SET ${ setString }
          WHERE id=${ postId }
          RETURNING *;
        `, Object.values(fields));
      }
  
      // return if no tags need updating
      if (tags === undefined) {
        return await getPostById(postId);
      }
  
      // create new tags if needed
      const tagList = await createTags(tags);
      const tagListIdString = tagList.map(
        tag => `${ tag.id }`
      ).join(', ');
  
      // delete post_tags that aren't in tagList
      await client.query(`
        DELETE FROM post_tags
        WHERE "tagId"
        NOT IN (${ tagListIdString })
        AND "postId"=$1;
      `, [postId]);
  
      // and create post_tags as necessary
      await addTagsToPost(postId, tagList);
  
      return await getPostById(postId);
    } catch (error) {
      throw error;
    }
  }


async function getAllPosts() {
    try {
      const { rows: postIds } = await client.query(`
        SELECT id
        FROM posts;
      `);
  
      const posts = await Promise.all(postIds.map(
        post => getPostById( post.id )
      ));
  
      return posts;
    } catch (error) {
      throw error;
    }
  }

  async function getPostById(postId) {
    try {
      const { rows: [ post ]  } = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;
      `, [postId]);
  
      const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
      `, [postId])
  
      const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `, [post.authorId])

      console.log("LOOK AT THIS", author)
  
      post.tags = tags;
      post.author = author;
  
      delete post.authorId;
  
      return post;
    } catch (error) {
      throw error;
    }
}

async function getPostsByUser(userId) {
    try {
      const { rows: postIds } = await client.query(`
        SELECT id 
        FROM posts 
        WHERE "authorId"=${ userId };
      `);
  
      const posts = await Promise.all(postIds.map(
        post => getPostById( post.id )
      ));
  
      return posts;
    } catch (error) {
      throw error;
    }
}

async function getPostsByTagName(tagName) {
  try {
      //connect posts to post_tags
      //then connect post_tags to tags with keys
      //select posts.id where tags.name is correct/matches?
    const { rows: postIds } = await client.query(`
      SELECT posts.id
      FROM posts
      JOIN post_tags ON posts.id=post_tags."postId"
      JOIN tags ON tags.id=post_tags."tagId"
      WHERE tags.name=$1;
    `, [tagName]);

    return await Promise.all(postIds.map(
      post => getPostById(post.id)
    ));
  } catch (error) {
    throw error;
  }
} 


async function createTags(tagList) {
    if (tagList.length === 0) {
        return;
    }

    const insertValues = tagList.map(
        (_, index) => `$${index + 1}`
    ).join('), (');
    //now use for VALUES in string template

    const selectValues = tagList.map(
        (_, index) => `$${index + 1}`
        ).join(', ');
        //now use for IN in string template
    try {
        //insert the tags(name)
        //use insertValues
        //ON CONFLICT do nothing
        await client.query(`
        INSERT INTO tags(name)
        VALUES(${insertValues})
        ON CONFLICT (name) DO NOTHING;
        `, tagList)

        //select all tags (*)
        //WHERE tells where to search: name
        //use selectValues
        const {rows } = await client.query(`
        SELECT * FROM tags
        WHERE name
        IN (${selectValues});
        `, tagList)

        // return all rows from query
        return rows;
    } catch (error) {
        throw error;
    }
}

async function createPostTag(postId, tagId) {
  try {
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);

  } catch (error) {
    throw error;
  }
}

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

async function getAllTags() {
  try {
    const { rows } = await client.query(`
    SELECT * 
    FROM tags;
    `);

    return { rows }
  } catch (error) {
    throw error;
  }

}

async function getUserByUsername(username) {
  try {
      const { rows: [user] } = await client.query (`
          SELECT *
          FROM users
          WHERE username=$1;
      `, [username]);

      return user;
  } catch (error) {
      throw error;
  }
}


  




//export
module.exports = {
    client,
    createUser,
    updateUser,
    getAllUsers,
    getUserById,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
    createTags,
    createPostTag,
    addTagsToPost,
    getPostById,
    getPostsByTagName,
    getAllTags,
    getUserByUsername
}