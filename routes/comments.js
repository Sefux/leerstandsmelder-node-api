'use strict';

var swagger = require('swagger-node-restify'),
    CommonController = require('../controllers/common'),
    res = new CommonController();

module.exports = {
    '/comments': {
        'post': {
            controller: res.map('post', {resource: 'Comment'}),
            scope: 'user',
            spec: {
                path: '/comments',
                description: 'Post a new comment',
                summary: 'Create Comment',
                params: [
                    swagger.bodyParam('Comment', 'A Comment object', 'Comment')
                ],
                errorResponses: [
                    swagger.errors.invalid('Comment')
                ],
                nickname: 'createComment',
                responseClass: 'Comment'
            }
        },
        'get': {
            controller: res.map('find', {resource: 'Comment'}),
            scope: 'user',
            spec: {
                path: '/comments',
                description: 'Get list of latest Comments',
                summary: 'Find Comments',
                nickname: 'findComments',
                responseClass: 'List[Comment]'
            }
        }

    },
    '/comments/:uuid': {
        'get': {
            controller: res.map('get', {resource: 'Comment'}),
            scope: 'public',
            spec: {
                path: '/comments/{uuid}',
                description: 'Get a comment',
                summary: 'Get Comment',
                params: [swagger.pathParam('uuid', 'UUID of the comment', 'string')],
                errorResponses: [swagger.errors.notFound('Comment')],
                nickname: 'getComment',
                responseClass: 'Comment'
            }
        },
        'put': {
            controller: res.map('put', {resource: 'Comment'}),
            scope: 'owner',
            spec: {
                path: '/comments/{uuid}',
                description: 'Update a comment',
                summary: 'Update Comment',
                params: [
                    swagger.pathParam('uuid', 'UUID of the comment', 'string'),
                    swagger.bodyParam('Comment', 'A Comment object', 'Comment')
                ],
                errorResponses: [
                    swagger.errors.notFound('Comment'),
                    swagger.errors.invalid('Comment')
                ],
                nickname: 'updateComment',
                responseClass: 'Comment'
            }
        },
        'delete': {
            controller: res.map('delete', {resource: 'Comment'}),
            scope: 'owner',
            spec: {
                path: '/comments/{uuid}',
                description: 'Delete a comment',
                summary: 'Delete Comment',
                params: [swagger.pathParam('uuid', 'UUID of the comment', 'string')],
                errorResponses: [swagger.errors.notFound('Comment')],
                nickname: 'deleteComment'
            }
        }
    },
    '/comments/:uuid/comments': {
        'get': {
            controller: res.map('find', {resource: 'Comment', query: {id_mapping: 'subject_uuid'}}),
            scope: 'public',
            spec: {
                path: '/comments/{uuid}/comments',
                description: 'Get comments for a resource. This can be replies to a previous comment but also comments on a Location, identified by its UUID.',
                summary: 'Get Comments for Resource',
                params: [swagger.pathParam('uuid', 'UUID of the resource that was commented on', 'string')],
                errorResponses: [swagger.errors.notFound('Comment')],
                nickname: 'getCommentsForResource',
                responseClass: 'List[Comment]'
            }
        }
    }
};