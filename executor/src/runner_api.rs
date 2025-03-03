use std::time::Duration;

use crate::task::{Task, TaskResponse};
use jsonrpsee::{
    core::{client::Client, Error as RpcError},
    proc_macros::rpc,
};

#[cfg(target_arch = "wasm32")]
use jsonrpsee::wasm_client::WasmClientBuilder;

#[cfg(feature = "std")]
use jsonrpsee::ws_client::WsClientBuilder;

use smoldot::json_rpc::methods::HexString;

#[rpc(client)]
pub trait RpcApi {
    #[method(name = "exec_storageGet")]
    fn storage_get(
        &self,
        task_id: u32,
        block_hash: &HexString,
        key: HexString,
    ) -> Result<Option<HexString>, RpcError>;

    #[method(name = "exec_prefixKeys")]
    fn prefix_keys(
        &self,
        task_id: u32,
        block_hash: &HexString,
        key: HexString,
    ) -> Result<Vec<HexString>, RpcError>;

    #[method(name = "exec_nextKey")]
    fn next_key(
        &self,
        task_id: u32,
        block_hash: &HexString,
        key: HexString,
    ) -> Result<Option<HexString>, RpcError>;

    #[method(name = "exec_getTask")]
    fn get_task(&self, task_id: u32) -> Result<Task, RpcError>;

    #[method(name = "exec_taskResult")]
    fn task_result(&self, task_id: u32, resp: &TaskResponse) -> Result<(), RpcError>;
}

pub async fn client(url: &str) -> Result<Client, RpcError> {
    #[cfg(target_arch = "wasm32")]
    let builder = WasmClientBuilder::default();
    #[cfg(feature = "std")]
    let builder = WsClientBuilder::default();

    let client = builder
        .request_timeout(Duration::from_secs(120))
        .build(url)
        .await?;
    Ok(client)
}
