---
slug: coding-interview-prep/top-k-frequent-elements
heroImage: ../../../assets/img/posts/top-k-frequent-elements/pexels-goumbik-669612.jpg
category: development
description: >-
  A walkthrough of "Top K Frequent Elements": why sorting by frequency costs
  more than it needs to, and how bucket sort gets the answer in linear time
  by exploiting a bound on how large a frequency can ever be.
pubDate: 2026-06-03T00:00:00.000Z
draft: false
tags:
  - leetcode
  - algorithms
  - java
  - bucket-sort
  - interview
title: Top K Frequent Elements - when sorting is overkill
---

Another one from my [running log of coding interview problems](https://github.com/adriangalera/leet): "Top K Frequent Elements" looks like a sorting problem at first glance, and a sort-based solution does pass. But the array you actually need to sort is bounded in a way that isn't obvious until you look closely, and once you spot that bound, the "sort" turns into something closer to a single counting pass.

## The problem

> Given an integer array `nums` and an integer `k`, return the `k` most frequent elements within the array. You may return the answer in any order.

Full statement on [neetcode.io](https://neetcode.io/problems/top-k-elements-in-list/question).

```text
Input: nums = [1, 2, 2, 3, 3, 3], k = 2
Output: [2, 3]  // 3 appears 3 times, 2 appears twice, 1 appears once

Input: nums = [7, 7], k = 1
Output: [7]
```

There's no requirement to break ties in any particular way, and no requirement on the order of the output — that flexibility is exactly what lets us avoid a full comparison-based sort later on.

## Brute force: count, then sort by frequency

The most direct reading of the problem is "count how often each value shows up, then sort those counts and take the top `k`":

```java
private int[] topKFrequentSorting(int[] nums, int k) {
    var map = new HashMap<Integer, Integer>();
    for (int num : nums) {
        map.put(num, map.getOrDefault(num, 0) + 1);
    }

    var entriesSorted = map.entrySet().stream()
            .sorted((entry1, entry2) -> entry2.getValue().compareTo(entry1.getValue()))
            .toList();

    int[] res = new int[k];
    for (int i = 0; i < k; i++) {
        res[i] = entriesSorted.get(i).getKey();
    }
    return res;
}
```

Building the frequency map is a single O(n) pass. But then we sort every distinct value by its count, and a general-purpose comparison sort costs **O(d log d)** where `d` is the number of distinct values (up to `n` in the worst case, if every element is unique). Overall that's **O(n log n)** time and **O(n)** space for the map. It's correct, and it's the answer most people write first, but it's paying for a full ordering of all the counts when we only ever look at the top `k` of them.

## A middle ground: a bounded max-heap

Before reaching for a full sort, it's worth noticing we don't need every count ordered relative to every other — we only need the `k` largest. That's what a heap is for. Keeping a min-heap capped at size `k`, and evicting the smallest entry whenever it grows past that size, guarantees that whatever survives at the end are the `k` largest counts:

```java
private int[] topKMaxHeap(int[] nums, int k) {
    var priorityQueue = new PriorityQueue<int[]>(Comparator.comparingInt(a -> a[0]));
    var map = new HashMap<Integer, Integer>();
    for (int num : nums) {
        map.put(num, map.getOrDefault(num, 0) + 1);
    }

    for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
        priorityQueue.offer(new int[]{entry.getValue(), entry.getKey()});
        if (priorityQueue.size() > k) {
            priorityQueue.poll();
        }
    }

    int[] res = new int[k];
    for (int i = k - 1; i >= 0; i--) {
        res[i] = priorityQueue.poll()[1];
    }

    return res;
}
```

Each of the `d` distinct entries triggers an `offer` and possibly a `poll`, and both operations on a heap capped at size `k` cost **O(log k)**, not O(log d). That brings the total down to **O(d log k)** time — strictly better than O(n log n) whenever `k` is small relative to the number of distinct values, which is the common case. Space is **O(d + k)**: the frequency map plus the heap. It's a real improvement, but it still pays a logarithmic cost per element because a heap is a comparison-based structure underneath.

## The optimal approach: bucket sort by frequency

Here's the detail both previous approaches leave on the table: a frequency can never exceed `n`, the length of the array. That's a hard ceiling, known in advance, completely independent of the actual values in `nums`. Whenever a value you'd otherwise sort by is bounded and known ahead of time, that's the signal to stop comparing and start indexing directly — the same move as swapping a hash set for a plain boolean array when the value range is small.

So instead of sorting counts, we bucket them: create `n + 1` buckets (frequencies range from `0` to `n`), and drop each distinct value into the bucket matching its count. The `k` most frequent elements now live in the buckets nearest the end of that array — no comparisons needed to find them, just a walk from the back:

```java
private int[] bucketSort(int[] nums, int k) {
    var map = new HashMap<Integer, Integer>();
    for (int num : nums) {
        map.put(num, map.getOrDefault(num, 0) + 1);
    }

    List<List<Integer>> buckets = new ArrayList<>();
    for (int i = 0; i <= nums.length; i++) {
        buckets.add(new ArrayList<>());
    }

    for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
        buckets.get(entry.getValue()).add(entry.getKey());
    }

    int[] res = new int[k];
    int acc = 0;
    for (int i = nums.length; i >= 0; i--) {
        for (int j = 0; j < buckets.get(i).size(); j++) {
            res[acc] = buckets.get(i).get(j);
            acc++;
            if (acc == k) break;
        }
        if (acc == k) break;
    }
    return res;
}
```

`buckets.get(frequency)` collects every value that occurs exactly that many times, so `buckets` ends up index-aligned with frequency the same way a boolean array is index-aligned with value. Walking it from `nums.length` down to `0` visits the most frequent values first, and we stop the moment we've collected `k` of them.

### Why this is O(n)

Building the frequency map is O(n). Allocating `n + 1` empty buckets and placing each of the `d` distinct values into its bucket is O(n) combined (`d` is at most `n`). The final walk touches every bucket slot once in the worst case, but it's still bounded by `n` slots total, and we short-circuit as soon as `acc` reaches `k` — so the walk is O(n) at worst and typically far less. There's no comparison anywhere in this algorithm; every step is a direct array index, which is what gets us from O(n log n) or O(d log k) down to a flat **O(n)**. Space is **O(n)** too, for the map and the buckets, which is no worse than what the sort-based version already needed.

## Takeaway

When a brute-force solution sorts a value that's actually bounded by something you already know — an array's length, an alphabet size, a fixed range — that bound is your cue to trade comparison-based sorting for direct indexing. Bucket sort (and its close cousin, counting sort) turns "sort by frequency" into "place into pre-sized slots," which drops an O(n log n) or O(d log k) step to O(n) any time the number of possible bucket values is linear in the input size.
