package utils;

public class Pair<A,B>
{
	public volatile A first;
	public volatile B second;
	
	public Pair(A a, B b)
	{
		this.first = a;
		this.second = b;
	}
}
