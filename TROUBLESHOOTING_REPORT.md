# Troubleshooting Report: BigQuery Connection Issue

## Problem Summary
The Airbyte connection to BigQuery is failing with the error:
```
Input was fully read, but some streams did not receive a terminal stream status message. 
If the destination did not encounter other errors, this likely indicates an error in the source or platform. 
Streams without a status message: [vturb_stats_by_day_by_origin, vturb_session_stats_by_day, vturb_players]
```

## Root Cause Analysis

### Primary Issue: Heartbeat Timeout
The source connector is timing out due to a **heartbeat timeout** after **1 hour 30 minutes** of no records being sent. The error log shows:
```
"failureType" : "heartbeat_timeout",
"internalMessage" : "Last record seen 1 hour 31 minutes 6 seconds ago, exceeding the threshold of 1 hour 30 minutes."
```

### What's Happening:
1. **Stream Processing Order**:
   - `vturb_players` completes successfully (50 records, ~6 seconds)
   - `vturb_session_stats_by_day` completes successfully (1,624 records, ~2 minutes)
   - `vturb_stats_by_day_by_origin` starts processing but takes **much longer** (160,000+ records)

2. **The Problem**:
   - `vturb_stats_by_day_by_origin` is processing a very large dataset (160,000+ records)
   - During processing, the source may go **more than 1.5 hours** without emitting records
   - Airbyte's heartbeat mechanism detects this gap and terminates the source process (exit code 143 = SIGTERM)
   - When the source is killed, it never sends terminal status messages (COMPLETE) for any streams
   - The destination then reports that streams didn't receive terminal status messages

3. **Evidence from Logs**:
   - Stream `vturb_stats_by_day_by_origin` starts at line 127-133
   - Records are being read: 5,000 → 10,000 → ... → 160,000+ (lines 163-195)
   - Processing continues for extended periods without record emission
   - After ~1.5 hours, heartbeat timeout occurs
   - Source process exits with code 143 (SIGTERM)
   - No COMPLETE status messages are sent

## Solutions

### Solution 1: Increase Heartbeat Timeout (Recommended)
**Action**: Increase the heartbeat timeout threshold in Airbyte configuration.

**How to do it**:
1. In Airbyte UI, go to your connection settings
2. Look for "Heartbeat Timeout" or "Source Heartbeat" settings
3. Increase from 1 hour 30 minutes to at least **3-4 hours** (or more based on your largest stream processing time)
4. Save and retry the sync

**Alternative**: If using Airbyte Cloud or API, update the connection configuration:
```json
{
  "sourceHeartbeatTimeoutMs": 14400000  // 4 hours in milliseconds
}
```

### Solution 2: Optimize Source Connector
**Action**: Modify the source connector to emit heartbeat records more frequently.

**Considerations**:
- If you control the source connector code, add periodic heartbeat emissions during long-running queries
- Emit progress updates even when no data records are ready
- This may require custom connector development

### Solution 3: Stream Processing Optimization
**Action**: Break down the large stream into smaller chunks.

**Options**:
1. **Date Range Partitioning**: If `vturb_stats_by_day_by_origin` can be partitioned by date, sync in smaller date ranges
2. **Incremental Sync**: Use incremental sync with smaller batch sizes
3. **Stream Splitting**: If possible, split the stream into multiple smaller streams

### Solution 4: Increase Source Resources
**Action**: Allocate more resources to the source connector to process faster.

**How to do it**:
1. In Airbyte, increase memory/CPU allocation for the source connector
2. This may help process records faster, reducing the time between record emissions

## Immediate Action Items

1. **Check Current Heartbeat Settings**: Verify the current heartbeat timeout configuration
2. **Estimate Processing Time**: Calculate how long `vturb_stats_by_day_by_origin` actually takes to process
3. **Set Appropriate Timeout**: Set heartbeat timeout to at least 2x the longest expected processing time
4. **Monitor Next Sync**: After applying the fix, monitor the next sync to ensure it completes

## Prevention

To prevent this issue in the future:
- Monitor sync durations and adjust heartbeat timeouts accordingly
- Consider implementing incremental syncs for large streams
- Set up alerts for sync failures
- Review and optimize slow streams regularly

## Additional Notes

- The extraction and load processes are working correctly (data is being read and written)
- The issue is purely with the completion/signaling mechanism
- This is a transient error that can be resolved with configuration changes
- The job failed after 21 retry attempts, indicating this is a persistent configuration issue

## References

- Airbyte Heartbeat Documentation: https://docs.airbyte.com/understanding-airbyte/heartbeats
- Error occurs in: `io.airbyte.cdk.load.state.SyncManager.markInputConsumed`
- Source timeout: `io.airbyte.container.orchestrator.worker.io.HeartbeatTimeoutException`

