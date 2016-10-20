'use strict';

var swagger = require('swagger-node-restify'),
    CommonController = require('../controllers/common'),
    res = new CommonController();

module.exports = {
    '/posts': {
        'post': {
            controller: res.map('post', {resource: 'Post', select: 'uuid title created updated'}),
            scope: 'user',
            spec: {
                path: '/posts',
                description: 'Add a new Post',
                summary: 'Create Post',
                params: [
                    swagger.bodyParam('Post', 'A Post object', 'Post')
                ],
                errorResponses: [
                    swagger.errors.invalid('Post')
                ],
                nickname: 'createPost',
                responseClass: 'Post'
            }
        },
        'get': {
            controller: res.map('find', {
                resource: 'Post',
                query: {$or: [{static: false}, {static: {$exists: false}}]}
            }),
            scope: 'public',
            spec: {
                path: '/posts',
                description: 'Get list of Posts',
                summary: 'Find Posts',
                nickname: 'findPosts',
                responseClass: 'List[Post]'
            }
        }
    },
    '/posts/static': {
        'get': {
            controller: res.map('find', {resource: 'Post', query: {static: true}}),
            scope: 'public',
            spec: {
                path: '/posts/static',
                description: 'Get list of static Posts',
                summary: 'Find Static Posts',
                nickname: 'findStaticPosts',
                responseClass: 'List[Post]'
            }
        }
    },
    '/posts/:uuid': {
        'get': {
            controller: res.map('get', {resource: 'Post'}),
            scope: 'public',
            spec: {
                path: '/posts/{uuid}',
                description: 'Get a post',
                summary: 'Get Post',
                params: [swagger.pathParam('uuid', 'UUID of the post', 'string')],
                errorResponses: [swagger.errors.notFound('Post')],
                nickname: 'getPost',
                responseClass: 'Post'
            }
        },
        'put': {
            controller: res.map('put', {resource: 'Post'}),
            scope: 'owner',
            spec: {
                path: '/posts/{uuid}',
                description: 'Update a post',
                summary: 'Update Post',
                params: [
                    swagger.pathParam('uuid', 'UUID of the photo', 'string'),
                    swagger.bodyParam('Post', 'A post object', 'Post')
                ],
                errorResponses: [swagger.errors.notFound('Post')],
                nickname: 'updatePost',
                responseClass: 'Post'
            }
        },
        'delete': {
            controller: res.map('delete', {resource: 'Post'}),
            scope: 'owner',
            spec: {
                path: '/posts/{uuid}',
                description: 'Delete a post',
                summary: 'Delete Post',
                params: [swagger.pathParam('uuid', 'UUID of the post', 'string')],
                errorResponses: [swagger.errors.notFound('Post')],
                nickname: 'deletePost'
            }
        }
    },
    '/posts/:uuid/comments': {
        'get': {
            controller: res.map('find', {resource: 'Comment', query: {id_mapping: 'subject_uuid'}}),
            scope: 'public',
            spec: {
                path: '/posts/{uuid}/comments',
                description: 'Get comments on a post.',
                summary: 'Get Post Comments',
                params: [swagger.pathParam('uuid', 'UUID of the post that was commented on', 'string')],
                errorResponses: [swagger.errors.notFound('Comment')],
                nickname: 'getPostComments',
                responseClass: 'List[Comment]'
            }
        }
    }
};