package utils;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;

public class BlockingHashMap<K,V>
{
	ConcurrentHashMap<K, Pair<CountDownLatch, V>> map;
	
	public BlockingHashMap()
	{
		map = new ConcurrentHashMap<>();
	}
	
	public V get(K key) throws InterruptedException
	{
		CountDownLatch latch;
		if (map.get(key) == null)
		{
			latch = new CountDownLatch(1);
			map.put(key, new Pair<CountDownLatch, V>(latch, null));
		}
		else
		{
			latch = map.get(key).first;
		}
		
		latch.await();
		
		return map.get(key).second;
	}
	
	public void put(K key, V value)
	{
		CountDownLatch latch;
		if (map.get(key) == null)
		{
			latch = new CountDownLatch(0);
			map.put(key, new Pair<CountDownLatch, V>(latch, value));
		}
		else
		{
			Pair<CountDownLatch, V> pair = map.get(key);
			pair.second = value;
			pair.first.countDown();
		}
	}
}