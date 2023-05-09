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

import { useState } from 'react';
import { View, Flex, Form, TextField, ActionButton, AlertDialog, DialogTrigger, Well } from '@adobe/react-spectrum';
import TaskList from '@spectrum-icons/workflow/TaskList';
import Close from '@spectrum-icons/workflow/Close';
import Add from '@spectrum-icons/workflow/Add';
import PropTypes from 'prop-types';
import { Todo } from './Todo';
import { MAX_TODO_ITEMS } from '../../../defaults.json';
import '@spectrum-css/typography';

function TodoList({ todoList, onDelete, onUpdate }) {
  const { name, todos } = todoList;

  const [newTodo, setNewTodo] = useState('');
  const [todoItems, setTodoItems] = useState(todos);

  return (
    <Well width="size-3000">
      <Flex direction="column" gap="size-200">
        <Flex gap="size-200" alignItems="center">
          <TaskList size="M" />
          <View flex="1">
            <h2 className="spectrum-Heading spectrum-Heading--sizeM spectrum-Heading--serif">{name}</h2>
          </View>
          <DialogTrigger>
            <ActionButton isQuiet>
              <Close />
            </ActionButton>
            <AlertDialog
              title="Clear todo list"
              variant="destructive"
              primaryActionLabel="Delete"
              secondaryActionLabel="Cancel"
              onPrimaryAction={async () => {
                onDelete && (await onDelete(name));
              }}>
              This action will clear the todo list <strong>{name}</strong>. Are you sure you want to continue ?
            </AlertDialog>
          </DialogTrigger>
        </Flex>
        <Form
          onSubmit={async (event) => {
            event.preventDefault();

            const index = todoItems.length;
            const newTodoItem = { name, id: index, value: newTodo, done: false };
            setTodoItems([newTodoItem, ...todoItems]);
            setNewTodo('');

            onUpdate && (await onUpdate(name, newTodoItem));
          }}>
          <Flex gap="size-50">
            <TextField
              autoComplete="off"
              isDisabled={todoItems.length >= MAX_TODO_ITEMS}
              aria-label="New todo"
              width="100%"
              value={newTodo}
              onChange={(value) => {
                setNewTodo(value);
              }}
              placeholder="Todo"
              minLength={1}
              maxLength={140}
            />
            <ActionButton type="submit" isDisabled={todoItems.length >= MAX_TODO_ITEMS}>
              <Add />
            </ActionButton>
          </Flex>
        </Form>
        <View marginTop="size-100">
          {todoItems.map((todo) => (
            <Todo key={todo.id} name={name} todo={todo} onUpdate={onUpdate} />
          ))}
        </View>
      </Flex>
    </Well>
  );
}

TodoList.propTypes = {
  todoList: PropTypes.object,
  onDelete: PropTypes.func,
  onUpdate: PropTypes.func
};

export { TodoList };
