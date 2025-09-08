import * as anchor from 'anchor-v31';
import { VertexProgram } from '../idl/vertex_program';
import vertexProgramJson from '../idl/vertex_program.json';
import { Connection } from '@solana/web3.js';

export const getProgram = (connection: Connection) => {
  return new anchor.Program<VertexProgram>(vertexProgramJson, {
    connection: new anchor.web3.Connection(connection.rpcEndpoint),
  });
};
