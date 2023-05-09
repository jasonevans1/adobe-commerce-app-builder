/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const { Core } = require('@adobe/aio-sdk');
const stateLib = require('@adobe/aio-lib-state');
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils');
const { MAX_TODO_ITEMS } = require('../../defaults.json');

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action');

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params));

    // check for missing request input parameters and headers
    const requiredParams = ['operation'];
    const requiredHeaders = ['Authorization'];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger);
    }

    const { operation, name, todo } = params;
    if (operation !== 'read' && !name) {
      return errorResponse(400, 'Missing "name" parameter', logger);
    }

    const state = await stateLib.init();

    let todoList = await state.get(`todolist`);
    if (todoList?.value) {
      todoList = todoList.value;
    }
    else {
      todoList = [];
    }

    let body = {};
    switch (operation) {
      case 'create':
        // Find the todo list by name
        if (!todoList.find(({ name: todoListName }) => todoListName === name)) {
          // If none found, create an empty list with the given name
          todoList.unshift({
            name,
            todos: []
          });

          // Store the new list in the state storage with no expiry time
          await state.put(`todolist`, todoList, { ttl: -1 });

          body.message = `"${name}" added.`;
        } else {
          return errorResponse(400, `"${name}" already exists.`, logger);
        }
        break;

      case 'read':
        // Simply return the todo lists
        body.todoList = todoList;
        break;

      case 'update':
        if (todo) {
          // Find the todo list by name
          const foundTodoList = todoList.find(({ name: todoListName }) => todoListName === name);
          if (foundTodoList) {
            // Find the todo item by id
            const todoIndex = foundTodoList.todos.findIndex(({ id }) => id === todo.id);
            if (todoIndex !== -1) {
              // Update the todo item
              foundTodoList.todos[todoIndex] = todo;
              body.message = `Todo "${todo.id}" updated in "${name}".`;

              await state.put(`todolist`, todoList, { ttl: -1 });
            } else {
              // Create a new todo item
              if (foundTodoList.todos.length < MAX_TODO_ITEMS) {
                foundTodoList.todos.unshift(todo);
                body.message = `Todo "${todo.id}" added to "${name}".`;

                await state.put(`todolist`, todoList, { ttl: -1 });
              } else {
                return errorResponse(400, `Max ${MAX_TODO_ITEMS} todos reached for "${name}".`, logger);
              }
            }
          } else {
            return errorResponse(400, `${name} not found.`, logger);
          }
        } else {
          return errorResponse(400, `Todo is missing.`, logger);
        }
        break;

      case 'delete':
        // Filter out the todo list to delete by name
        const updatedTodoList = todoList.filter(({ name: todoListName }) => todoListName !== name);

        await state.put(`todolist`, updatedTodoList, { ttl: -1 });

        body.message = `"${name}" todo list deleted.`;
        break;

      default:
        return errorResponse(400, 'CRUD operation not found', logger);
    }

    return {
      statusCode: 200,
      body
    };
  } catch (error) {
    // log any server errors
    logger.error(error);
    // return with 500
    return errorResponse(500, error.message, logger);
  }
}

exports.main = main;
